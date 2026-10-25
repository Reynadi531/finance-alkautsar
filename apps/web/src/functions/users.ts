import { session, user } from "@keuangan-alkautsar/db/schema/auth";
import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, ilike, isNotNull, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import z from "zod";

import { pageOffset } from "@/lib/pagination";
import { authMiddleware } from "@/middleware/auth";
import { recordAudit, type AuditSnapshots } from "@/server/audit";
import { adminOnly, requireRole } from "@/server/authz";
import { auth, db } from "@/services";

export const USERS_PAGE_SIZE = 6;
export const MIN_PASSWORD_LENGTH = 8;

const roleSchema = z.enum(["admin", "treasurer", "viewer"], "Pilih peran pengguna.");

export const userListSearchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  role: roleSchema.optional().catch(undefined),
  status: z.enum(["active", "inactive"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export type UserListSearch = z.infer<typeof userListSearchSchema>;

// "Active" means the account can use the app: not deactivated and holding a role.
const isActive = and(isNull(user.deactivatedAt), isNotNull(user.role));
const isInactive = or(isNotNull(user.deactivatedAt), isNull(user.role));

/** Latest session activity per user (sessions are refreshed while the user is active). */
function lastActiveSubquery() {
  return db
    .select({ userId: session.userId, at: sql<Date | string>`max(${session.updatedAt})`.as("at") })
    .from(session)
    .groupBy(session.userId)
    .as("last_active");
}

/** `max()` over a UTC `timestamp` column may arrive as a Date or a raw "YYYY-MM-DD hh:mm:ss" string. */
function toIsoTimestamp(value: Date | string | null) {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}

export type UserRow = Awaited<ReturnType<typeof listUsers>>["users"][number];

/** S07 list: summary counts, filtered page of users, and each user's latest session activity. */
export const listUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(userListSearchSchema)
  .handler(async ({ context, data: search }) => {
    const actor = requireRole(context.session, adminOnly);

    const filters: SQL[] = [];
    if (search.q) {
      const pattern = `%${search.q.replace(/[%_\\]/g, "\\$&")}%`;
      filters.push(or(ilike(user.name, pattern), ilike(user.email, pattern))!);
    }
    if (search.role) filters.push(eq(user.role, search.role));
    if (search.status === "active") filters.push(isActive!);
    if (search.status === "inactive") filters.push(isInactive!);
    const where = filters.length > 0 ? and(...filters) : undefined;
    const lastActiveAt = lastActiveSubquery();

    const [[stats], [{ total }]] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`(count(*) filter (where ${isActive}))::int`,
          admins: sql<number>`(count(*) filter (where ${isActive} and ${user.role} = 'admin'))::int`,
        })
        .from(user),
      db.select({ total: count() }).from(user).where(where),
    ]);
    // A stale `page` past the end shows the last page instead of an empty table.
    const page = Math.min(search.page ?? 1, Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)));
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        deactivatedAt: user.deactivatedAt,
        lastActiveAt: lastActiveAt.at,
      })
      .from(user)
      .leftJoin(lastActiveAt, eq(lastActiveAt.userId, user.id))
      .where(where)
      .orderBy(sql`${user.deactivatedAt} is not null`, user.name, user.id)
      .limit(USERS_PAGE_SIZE)
      .offset(pageOffset(page, USERS_PAGE_SIZE));

    return {
      currentUserId: actor.id,
      stats,
      total,
      page,
      users: users.map((row) => ({
        ...row,
        lastActiveAt: toIsoTimestamp(row.lastActiveAt),
        active: row.deactivatedAt === null && row.role !== null,
      })),
    };
  });

type UserRecord = typeof user.$inferSelect;

function snapshot(
  record: Pick<UserRecord, "name" | "email" | "role" | "deactivatedAt">,
): AuditSnapshots["user"] {
  return {
    name: record.name,
    email: record.email,
    role: record.role,
    active: record.deactivatedAt === null && record.role !== null,
  };
}

function entityLabel(record: Pick<UserRecord, "name" | "email">) {
  return `${record.name} · ${record.email}`;
}

async function findUser(id: string) {
  const [record] = await db.select().from(user).where(eq(user.id, id));
  if (!record) throw new Error("Pengguna tidak ditemukan.");
  return record;
}

/** Throws when removing `targetId` from the active admins would leave none. */
async function assertAnotherActiveAdmin(targetId: string) {
  const [{ others }] = await db
    .select({ others: count() })
    .from(user)
    .where(and(eq(user.role, "admin"), isNull(user.deactivatedAt), ne(user.id, targetId)));
  if (others === 0) {
    throw new Error("Harus ada minimal satu administrator aktif.");
  }
}

const nameSchema = z
  .string()
  .trim()
  .min(1, "Nama lengkap wajib diisi.")
  .max(100, "Nama lengkap maksimal 100 karakter.");

const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`)
  .max(128, "Kata sandi maksimal 128 karakter.");

export const createUserSchema = z.object({
  name: nameSchema,
  email: z.string().trim().toLowerCase().pipe(z.email("Masukkan alamat email yang valid.")),
  password: passwordSchema,
  role: roleSchema,
});

export type CreateUserResult =
  | { ok: true; id: string }
  | { ok: false; field: "email"; message: string };

/**
 * Creates an account with a credential password through Better Auth's internal adapter.
 * Unlike `signUpEmail`, this never issues a session, so the admin stays signed in.
 */
export const createUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(createUserSchema)
  .handler(async ({ context, data }): Promise<CreateUserResult> => {
    const actor = requireRole(context.session, adminOnly);
    const authContext = await auth.$context;

    const duplicate = {
      ok: false,
      field: "email",
      message: "Email ini sudah terdaftar. Gunakan email lain.",
    } as const;
    if (await authContext.internalAdapter.findUserByEmail(data.email)) return duplicate;

    let created: { id: string };
    try {
      created = await authContext.internalAdapter.createUser(
        { name: data.name, email: data.email, role: data.role },
        { method: "admin" },
      );
    } catch (error) {
      // A concurrent create with the same email hits the unique constraint.
      if (await authContext.internalAdapter.findUserByEmail(data.email)) return duplicate;
      throw error;
    }

    try {
      await authContext.internalAdapter.linkAccount({
        userId: created.id,
        providerId: "credential",
        accountId: created.id,
        password: await authContext.password.hash(data.password),
      });
      await db.transaction(async (tx) => {
        // Set the role explicitly in case the adapter drops non-input additional fields.
        await tx.update(user).set({ role: data.role }).where(eq(user.id, created.id));
        await recordAudit(tx, {
          actorId: actor.id,
          action: "create",
          entity: "user",
          entityId: created.id,
          entityLabel: entityLabel(data),
          summary: "Menambahkan pengguna",
          after: snapshot({ ...data, deactivatedAt: null }),
        });
      });
    } catch (error) {
      // Don't leave a half-created account (no password or no audit entry) behind.
      await authContext.internalAdapter.deleteUser(created.id);
      throw error;
    }

    return { ok: true, id: created.id };
  });

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: nameSchema,
  role: roleSchema,
});

/** Changes a user's name and role. Admins cannot demote themselves or the last active admin. */
export const updateUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateUserSchema)
  .handler(async ({ context, data }) => {
    const actor = requireRole(context.session, adminOnly);
    const before = await findUser(data.id);

    if (before.role === "admin" && data.role !== "admin") {
      if (before.id === actor.id) {
        throw new Error("Anda tidak dapat mengubah peran akun Anda sendiri.");
      }
      if (before.deactivatedAt === null) await assertAnotherActiveAdmin(before.id);
    }
    if (before.name === data.name && before.role === data.role) return { changed: false };

    const after = { ...before, name: data.name, role: data.role };
    await db.transaction(async (tx) => {
      await tx.update(user).set({ name: data.name, role: data.role }).where(eq(user.id, data.id));
      await recordAudit(tx, {
        actorId: actor.id,
        action: "update",
        entity: "user",
        entityId: data.id,
        entityLabel: entityLabel(after),
        summary: before.role === data.role ? "Mengubah data pengguna" : "Mengubah peran pengguna",
        before: snapshot(before),
        after: snapshot(after),
      });
    });
    return { changed: true };
  });

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1), active: z.boolean() }))
  .handler(async ({ context, data }) => {
    const actor = requireRole(context.session, adminOnly);
    const before = await findUser(data.id);

    if (!data.active) {
      if (before.id === actor.id) {
        throw new Error("Anda tidak dapat menonaktifkan akun Anda sendiri.");
      }
      if (before.role === "admin" && before.deactivatedAt === null) {
        await assertAnotherActiveAdmin(before.id);
      }
    }
    if ((before.deactivatedAt === null) === data.active) return { changed: false };

    const after = { ...before, deactivatedAt: data.active ? null : new Date() };
    await db.transaction(async (tx) => {
      await tx.update(user).set({ deactivatedAt: after.deactivatedAt }).where(eq(user.id, data.id));
      if (!data.active) {
        // Sign the user out everywhere; the session.create hook blocks new sign-ins.
        await tx.delete(session).where(eq(session.userId, data.id));
      }
      await recordAudit(tx, {
        actorId: actor.id,
        action: data.active ? "restore" : "archive",
        entity: "user",
        entityId: data.id,
        entityLabel: entityLabel(before),
        summary: data.active ? "Mengaktifkan pengguna" : "Menonaktifkan pengguna",
        before: snapshot(before),
        after: snapshot(after),
      });
    });
    return { changed: true };
  });

/**
 * Sets a new temporary password. Other users are signed out of every device; the audit
 * entry records only that a reset happened, never the password.
 */
export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1), password: passwordSchema }))
  .handler(async ({ context, data }) => {
    const actor = requireRole(context.session, adminOnly);
    const target = await findUser(data.id);
    const authContext = await auth.$context;
    const hash = await authContext.password.hash(data.password);

    if (await authContext.internalAdapter.findCredentialAccount(target.id)) {
      await authContext.internalAdapter.updatePassword(target.id, hash);
    } else {
      await authContext.internalAdapter.linkAccount({
        userId: target.id,
        providerId: "credential",
        accountId: target.id,
        password: hash,
      });
    }

    await db.transaction(async (tx) => {
      if (target.id !== actor.id) {
        await tx.delete(session).where(eq(session.userId, target.id));
      }
      await recordAudit(tx, {
        actorId: actor.id,
        action: "update",
        entity: "user",
        entityId: target.id,
        entityLabel: entityLabel(target),
        summary: "Mengatur ulang kata sandi pengguna",
      });
    });
    return { ok: true };
  });
