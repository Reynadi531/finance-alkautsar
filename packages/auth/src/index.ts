import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@keuangan-alkautsar/db";
import * as schema from "@keuangan-alkautsar/db/schema/auth";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
};

export function createAuth(env: AuthConfig, database: Database) {
  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "pg",
      schema,
    }),
    trustedOrigins: [env.BETTER_AUTH_URL],
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        // Assigned by an administrator, never by the user at sign-up.
        role: { type: ["admin", "treasurer", "viewer"], required: false, input: false },
        deactivatedAt: { type: "date", required: false, input: false },
      },
    },
    databaseHooks: {
      session: {
        create: {
          // Deactivated accounts keep their history but can no longer sign in.
          before: async (session, ctx) => {
            const account = (await ctx?.context.internalAdapter.findUserById(session.userId)) as
              | { deactivatedAt?: Date | null }
              | null
              | undefined;
            if (account?.deactivatedAt) {
              throw new APIError("FORBIDDEN", { message: "Akun ini sudah dinonaktifkan." });
            }
          },
        },
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [tanstackStartCookies()],
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
