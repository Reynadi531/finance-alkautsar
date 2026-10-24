/**
 * Development seed: two mosques, an admin and a treasurer, categories, and
 * five months of transactions. Run with `bun run db:seed` from apps/web.
 * Safe to re-run: it skips when the admin account already exists.
 */
import { createAuth } from "@keuangan-alkautsar/auth";
import { createDb } from "@keuangan-alkautsar/db";
import { user } from "@keuangan-alkautsar/db/schema/auth";
import {
  category,
  ledgerTransaction,
  mosque,
  mosqueMember,
} from "@keuangan-alkautsar/db/schema/finance";
import { eq } from "drizzle-orm";

const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
};

const db = createDb(env);
const auth = createAuth(env, db);

const PASSWORD = "rahasia-dev-123";

async function ensureUser(name: string, email: string) {
  const [existing] = await db.select().from(user).where(eq(user.email, email));
  if (existing) return existing.id;
  const result = await auth.api.signUpEmail({ body: { name, email, password: PASSWORD } });
  return result.user.id;
}

async function seedMosque(
  name: string,
  createdBy: string,
  scale: number,
  months: readonly string[],
) {
  const [created] = await db.insert(mosque).values({ name }).returning();
  const incomeNames = ["Saldo awal", "Infaq Jumat", "Donasi", "Zakat", "Wakaf"];
  const expenseNames = ["Tagihan listrik", "Kebersihan", "Perlengkapan", "Renovasi"];
  const categories = await db
    .insert(category)
    .values([
      ...incomeNames.map((categoryName) => ({
        mosqueId: created.id,
        kind: "income" as const,
        name: categoryName,
      })),
      ...expenseNames.map((categoryName) => ({
        mosqueId: created.id,
        kind: "expense" as const,
        name: categoryName,
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
      mosqueId: created.id,
      kind,
      categoryId: byName[categoryName],
      effectiveDate,
      amount: Math.round(amount * scale),
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
  return created.id;
}

const [existingAdmin] = await db.select().from(user).where(eq(user.email, "nadia@example.com"));
if (existingAdmin) {
  console.log("Seed skipped: nadia@example.com already exists.");
  process.exit(0);
}

const adminId = await ensureUser("Nadia Fitriani", "nadia@example.com");
const treasurerId = await ensureUser("Hasan Basri", "hasan@example.com");
const months = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10"] as const;

const alIkhlas = await seedMosque("Masjid Al-Ikhlas", adminId, 1, months);
const alAzhar = await seedMosque("Masjid Al-Azhar", adminId, 0.4, months);

await db.insert(mosqueMember).values([
  { mosqueId: alIkhlas, userId: adminId, role: "admin" },
  { mosqueId: alAzhar, userId: adminId, role: "admin" },
  { mosqueId: alIkhlas, userId: treasurerId, role: "treasurer" },
]);

console.log(`Seeded. Sign in as nadia@example.com or hasan@example.com with "${PASSWORD}".`);
process.exit(0);
