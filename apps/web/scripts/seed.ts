/**
 * Development seed: the mosque profile, an admin and a treasurer, categories, and
 * five months of transactions. Run with `bun run db:seed` from apps/web.
 * Safe to re-run: it skips when the admin account already exists.
 */
import { createAuth } from "@keuangan-alkautsar/auth";
import { createDb } from "@keuangan-alkautsar/db";
import { user } from "@keuangan-alkautsar/db/schema/auth";
import { category, ledgerTransaction, mosque } from "@keuangan-alkautsar/db/schema/finance";
import { eq } from "drizzle-orm";

const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
};

const db = createDb(env);
const auth = createAuth(env, db);

const PASSWORD = "rahasia-dev-123";

async function ensureUser(name: string, email: string, role: "admin" | "treasurer" | "viewer") {
  const [existing] = await db.select().from(user).where(eq(user.email, email));
  const id =
    existing?.id ??
    (await auth.api.signUpEmail({ body: { name, email, password: PASSWORD } })).user.id;
  // `role` is not accepted at sign-up, so it is assigned directly.
  await db.update(user).set({ role }).where(eq(user.id, id));
  return id;
}

async function seedLedger(createdBy: string, months: readonly string[]) {
  const incomeNames = ["Saldo awal", "Infaq Jumat", "Donasi", "Zakat", "Wakaf"];
  const expenseNames = ["Tagihan listrik", "Kebersihan", "Perlengkapan", "Renovasi"];
  const categories = await db
    .insert(category)
    .values([
      ...incomeNames.map((categoryName, index) => ({
        kind: "income" as const,
        name: categoryName,
        code: `PM-${String(index + 1).padStart(3, "0")}`,
      })),
      ...expenseNames.map((categoryName, index) => ({
        kind: "expense" as const,
        name: categoryName,
        code: `PK-${String(index + 1).padStart(3, "0")}`,
      })),
    ])
    .returning();
  const byName = Object.fromEntries(categories.map((row) => [row.name, row.id]));

  const rows: (typeof ledgerTransaction.$inferInsert)[] = [];
  const add = (
    kind: "income" | "expense",
    categoryName: string,
    effectiveDate: string,
    amount: number,
    description?: string,
  ) =>
    rows.push({
      kind,
      categoryId: byName[categoryName],
      effectiveDate,
      amount: Math.round(amount),
      description,
      createdBy,
    });

  add("income", "Saldo awal", `${months[0]}-01`, 30_000_000);
  months.forEach((month, index) => {
    const growth = 1 + index * 0.08;
    for (const day of ["03", "10", "17", "24", "31"]) {
      if (month.endsWith("06") && day === "31") continue;
      if (month.endsWith("09") && day === "31") continue;
      add("income", "Infaq Jumat", `${month}-${day}`, 2_100_000 * growth);
    }
    add("income", "Donasi", `${month}-12`, 1_500_000 * growth, "Donasi jamaah");
    add("income", "Zakat", `${month}-20`, 900_000);
    add("expense", "Tagihan listrik", `${month}-05`, 875_000);
    add("expense", "Kebersihan", `${month}-15`, 1_200_000 * growth);
    add("expense", "Perlengkapan", `${month}-22`, 1_650_000);
  });
  const last = months[months.length - 1];
  add("income", "Donasi", `${last}-29`, 1_000_000, "Donasi keluarga H. Umar");
  add("expense", "Tagihan listrik", `${last}-30`, 875_000);
  add("expense", "Renovasi", `${last}-18`, 2_400_000, "Perbaikan atap serambi");

  await db.insert(ledgerTransaction).values(rows);
}

const [existingAdmin] = await db.select().from(user).where(eq(user.email, "nadia@example.com"));
if (existingAdmin) {
  console.log("Seed skipped: nadia@example.com already exists.");
  process.exit(0);
}

const adminId = await ensureUser("Nadia Fitriani", "nadia@example.com", "admin");
await ensureUser("Hasan Basri", "hasan@example.com", "treasurer");
const months = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10"] as const;

await db.insert(mosque).values({ name: "Masjid Al-Kautsar" }).onConflictDoNothing();
await seedLedger(adminId, months);

console.log(`Seeded. Sign in as nadia@example.com or hasan@example.com with "${PASSWORD}".`);
process.exit(0);
