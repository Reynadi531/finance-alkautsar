import { category, ledgerTransaction } from "@keuangan-alkautsar/db/schema/finance";
import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import z from "zod";

import {
  categoryFormSchema,
  categoryKinds,
  categoryStatusSchema,
  type CategoryKind,
} from "@/components/categories/category-kinds";
import { currentMonthRange } from "@/lib/date-range";
import { authMiddleware } from "@/middleware/auth";
import { recordAudit, type AuditSnapshots } from "@/server/audit";
import { adminOnly, requireRole } from "@/server/authz";
import { db } from "@/services";

const kindSchema = z.enum(["income", "expense"]);

type CategoryRow = typeof category.$inferSelect;
type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CategoryFieldErrors = Partial<Record<"name" | "code", string>>;
export type CategoryMutationResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: CategoryFieldErrors };

const verbs = {
  create: "Menambahkan",
  update: "Mengubah",
  archive: "Mengarsipkan",
  restore: "Memulihkan",
  delete: "Menghapus",
} as const;

function snapshot(row: CategoryRow): AuditSnapshots["category"] {
  return {
    kind: row.kind,
    name: row.name,
    code: row.code,
    note: row.note,
    archived: row.archivedAt !== null,
  };
}

async function audit(
  tx: Executor,
  actorId: string,
  action: keyof typeof verbs,
  row: CategoryRow,
  before: CategoryRow | null,
  after: CategoryRow | null,
) {
  await recordAudit(tx, {
    actorId,
    action,
    entity: "category",
    entityId: row.id,
    entityLabel: `${row.name} · ${row.code}`,
    summary: `${verbs[action]} kategori ${categoryKinds[row.kind].noun}`,
    before: before ? snapshot(before) : null,
    after: after ? snapshot(after) : null,
  });
}

/** Postgres unique-violation constraint name, if `error` (or a wrapped cause) is one. */
function uniqueViolation(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current === "object" && "code" in current && current.code === "23505") {
      return "constraint" in current ? String(current.constraint) : "";
    }
    current = typeof current === "object" && "cause" in current ? current.cause : null;
  }
  return null;
}

function nameTakenError(name: string): CategoryFieldErrors {
  return { name: `Nama “${name}” sudah dipakai tipe aktif lain.` };
}

function codeTakenError(code: string, owner?: string): CategoryFieldErrors {
  return {
    code: owner ? `Kode ${code} sudah dipakai oleh “${owner}”.` : `Kode ${code} sudah dipakai.`,
  };
}

function invalid(fieldErrors: CategoryFieldErrors): CategoryMutationResult {
  return { ok: false, message: "Periksa kembali isian yang ditandai.", fieldErrors };
}

/** Maps a unique-index violation raced past the pre-checks to the matching field error. */
function mapConstraintError(error: unknown, name: string, code: string): CategoryMutationResult {
  const constraint = uniqueViolation(error);
  if (constraint === "category_active_name_idx") return invalid(nameTakenError(name));
  if (constraint === "category_code_idx") return invalid(codeTakenError(code));
  throw error;
}

async function findActiveNameClash(
  tx: Executor,
  kind: CategoryKind,
  name: string,
  excludeId?: string,
) {
  const [clash] = await tx
    .select({ id: category.id })
    .from(category)
    .where(
      and(
        eq(category.kind, kind),
        isNull(category.archivedAt),
        sql`lower(btrim(${category.name})) = lower(btrim(${name}))`,
        excludeId ? ne(category.id, excludeId) : undefined,
      ),
    )
    .limit(1);
  return clash ?? null;
}

async function findCodeOwner(tx: Executor, code: string, excludeId?: string) {
  const [owner] = await tx
    .select({ name: category.name })
    .from(category)
    .where(
      and(
        sql`upper(btrim(${category.code})) = upper(btrim(${code}))`,
        excludeId ? ne(category.id, excludeId) : undefined,
      ),
    )
    .limit(1);
  return owner ?? null;
}

/** Next free "<prefix>-NNN" code, e.g. PM-007. */
function suggestCode(prefix: string, codes: readonly string[]) {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const highest = codes.reduce((max, code) => {
    const match = pattern.exec(code.trim().toUpperCase());
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(3, "0")}`;
}

export type CategoryListItem = Awaited<ReturnType<typeof getCategoryList>>["items"][number];
export type CategoryList = Awaited<ReturnType<typeof getCategoryList>>;

/** Categories of one kind with usage figures, filtered by status and search text. */
export const getCategoryList = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      kind: kindSchema,
      status: categoryStatusSchema,
      q: z.string().max(100).optional(),
    }),
  )
  .handler(async ({ context, data: { kind, status, q } }) => {
    requireRole(context.session, adminOnly);
    const month = currentMonthRange();
    const prefix = categoryKinds[kind].codePrefix;

    const [rows, usageRows, prefixedCodes] = await Promise.all([
      db
        .select()
        .from(category)
        .where(eq(category.kind, kind))
        .orderBy(asc(sql`lower(${category.name})`)),
      db
        .select({
          categoryId: ledgerTransaction.categoryId,
          // Soft-deleted rows still reference the category, so they block hard deletion.
          references: sql<number>`count(*)::int`,
          used: sql<number>`(count(*) filter (where ${ledgerTransaction.deletedAt} is null))::int`,
          usedThisMonth: sql<number>`(count(*) filter (where ${ledgerTransaction.deletedAt} is null and ${ledgerTransaction.effectiveDate} between ${month.from} and ${month.to}))::int`,
          lastUsed: sql<
            string | null
          >`(max(${ledgerTransaction.effectiveDate}) filter (where ${ledgerTransaction.deletedAt} is null))::text`,
        })
        .from(ledgerTransaction)
        .innerJoin(category, eq(category.id, ledgerTransaction.categoryId))
        .where(eq(category.kind, kind))
        .groupBy(ledgerTransaction.categoryId),
      db
        .select({ code: category.code })
        .from(category)
        .where(sql`upper(btrim(${category.code})) like ${`${prefix}-%`}`),
    ]);

    const usage = new Map(usageRows.map((row) => [row.categoryId, row]));
    const all = rows.map((row) => {
      const stats = usage.get(row.id);
      return {
        id: row.id,
        kind: row.kind,
        name: row.name,
        code: row.code,
        note: row.note,
        archived: row.archivedAt !== null,
        archivedAt: row.archivedAt?.toISOString() ?? null,
        transactionCount: stats?.used ?? 0,
        usedThisMonth: stats?.usedThisMonth ?? 0,
        lastUsed: stats?.lastUsed ?? null,
        deletable: (stats?.references ?? 0) === 0,
      };
    });

    const active = all.filter((item) => !item.archived);
    const usedActive = active.filter((item) => item.usedThisMonth > 0);
    const needle = q?.trim().toLowerCase();
    const inStatus = all
      .filter((item) => status === "all" || item.archived === (status === "archived"))
      // "Semua status" lists active types first, each group by name.
      .sort((a, b) => Number(a.archived) - Number(b.archived));
    const items = needle
      ? inStatus.filter(
          (item) =>
            item.name.toLowerCase().includes(needle) || item.code.toLowerCase().includes(needle),
        )
      : inStatus;

    return {
      kind,
      items,
      statusTotal: inStatus.length,
      stats: {
        active: active.length,
        archived: all.length - active.length,
        usedThisMonth: usedActive.length,
        transactionsThisMonth: usedActive.reduce((sum, item) => sum + item.usedThisMonth, 0),
      },
      nextCode: suggestCode(
        prefix,
        prefixedCodes.map((row) => row.code),
      ),
    };
  });

/** Create (no `id`) or update a category. Returns field errors instead of throwing. */
export const saveCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string().optional(),
      kind: kindSchema,
      name: z.string(),
      code: z.string(),
      note: z.string(),
    }),
  )
  .handler(async ({ context, data }): Promise<CategoryMutationResult> => {
    const actor = requireRole(context.session, adminOnly);
    const parsed = categoryFormSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: CategoryFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if ((field === "name" || field === "code") && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return invalid(fieldErrors);
    }
    const { name, code } = parsed.data;
    const note = parsed.data.note || null;

    try {
      return await db.transaction(async (tx): Promise<CategoryMutationResult> => {
        const before = data.id
          ? ((await tx.select().from(category).where(eq(category.id, data.id)).limit(1))[0] ?? null)
          : null;
        if (data.id && (!before || before.kind !== data.kind)) {
          return {
            ok: false,
            message: "Tipe tidak ditemukan. Muat ulang halaman, lalu coba lagi.",
          };
        }

        const fieldErrors: CategoryFieldErrors = {};
        // Archived types may share a name with an active one; the clash is checked on restore.
        if (!before?.archivedAt && (await findActiveNameClash(tx, data.kind, name, data.id))) {
          Object.assign(fieldErrors, nameTakenError(name));
        }
        const codeOwner = await findCodeOwner(tx, code, data.id);
        if (codeOwner) Object.assign(fieldErrors, codeTakenError(code, codeOwner.name));
        if (fieldErrors.name || fieldErrors.code) return invalid(fieldErrors);

        if (!before) {
          const [created] = await tx
            .insert(category)
            .values({ kind: data.kind, name, code, note })
            .returning();
          await audit(tx, actor.id, "create", created, null, created);
          return { ok: true };
        }

        if (before.name === name && before.code === code && before.note === note) {
          return { ok: true };
        }
        const [updated] = await tx
          .update(category)
          .set({ name, code, note })
          .where(eq(category.id, before.id))
          .returning();
        await audit(tx, actor.id, "update", updated, before, updated);
        return { ok: true };
      });
    } catch (error) {
      return mapConstraintError(error, name, code);
    }
  });

/** Archive (hide from transaction forms) or restore a category. */
export const setCategoryArchived = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string(), archived: z.boolean() }))
  .handler(async ({ context, data }): Promise<CategoryMutationResult> => {
    const actor = requireRole(context.session, adminOnly);
    try {
      return await db.transaction(async (tx): Promise<CategoryMutationResult> => {
        const [before] = await tx.select().from(category).where(eq(category.id, data.id)).limit(1);
        if (!before) {
          return {
            ok: false,
            message: "Tipe tidak ditemukan. Muat ulang halaman, lalu coba lagi.",
          };
        }
        if ((before.archivedAt !== null) === data.archived) return { ok: true };

        if (
          !data.archived &&
          (await findActiveNameClash(tx, before.kind, before.name, before.id))
        ) {
          return {
            ok: false,
            message: `Tidak bisa memulihkan: nama “${before.name}” sudah dipakai tipe aktif lain. Ganti nama tipe ini terlebih dahulu.`,
            fieldErrors: nameTakenError(before.name),
          };
        }

        const [after] = await tx
          .update(category)
          .set({ archivedAt: data.archived ? new Date() : null })
          .where(eq(category.id, before.id))
          .returning();
        await audit(tx, actor.id, data.archived ? "archive" : "restore", after, before, after);
        return { ok: true };
      });
    } catch (error) {
      if (uniqueViolation(error) === "category_active_name_idx") {
        return {
          ok: false,
          message: "Tidak bisa memulihkan: nama tipe ini sudah dipakai tipe aktif lain.",
        };
      }
      throw error;
    }
  });

/** Permanently delete a category that no transaction (including deleted ones) references. */
export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }): Promise<CategoryMutationResult> => {
    const actor = requireRole(context.session, adminOnly);
    return db.transaction(async (tx): Promise<CategoryMutationResult> => {
      const [before] = await tx.select().from(category).where(eq(category.id, data.id)).limit(1);
      if (!before) {
        return { ok: false, message: "Tipe tidak ditemukan. Muat ulang halaman, lalu coba lagi." };
      }
      const [{ references }] = await tx
        .select({ references: sql<number>`count(*)::int` })
        .from(ledgerTransaction)
        .where(eq(ledgerTransaction.categoryId, before.id));
      if (references > 0) {
        return {
          ok: false,
          message: "Tipe yang sudah dipakai tidak bisa dihapus, tetapi dapat diarsipkan.",
        };
      }
      await tx.delete(category).where(eq(category.id, before.id));
      await audit(tx, actor.id, "delete", before, before, null);
      return { ok: true };
    });
  });
