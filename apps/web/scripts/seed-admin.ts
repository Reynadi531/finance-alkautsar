/**
 * Admin-only seed: creates a single admin account and nothing else. Credentials come
 * from ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME (optional). Run with
 * `ADMIN_EMAIL=... ADMIN_PASSWORD=... bun run db:seed:admin` from apps/web.
 * Safe to re-run: an existing account with that email is promoted to admin.
 */
import { createAuth } from "@keuangan-alkautsar/auth";
import { createDb } from "@keuangan-alkautsar/db";
import { user } from "@keuangan-alkautsar/db/schema/auth";
import { eq } from "drizzle-orm";

const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
};

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Admin";

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  process.exit(1);
}

const db = createDb(env);
const auth = createAuth(env, db);

const [existing] = await db.select().from(user).where(eq(user.email, email));
const id =
  existing?.id ?? (await auth.api.signUpEmail({ body: { name, email, password } })).user.id;
// `role` is not accepted at sign-up, so it is assigned directly.
await db.update(user).set({ role: "admin" }).where(eq(user.id, id));

console.log(existing ? `${email} already exists; ensured admin role.` : `Created admin ${email}.`);
process.exit(0);
