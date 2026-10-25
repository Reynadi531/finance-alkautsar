import type { user } from "@keuangan-alkautsar/db/schema/auth";
import { mosque } from "@keuangan-alkautsar/db/schema/finance";

import { db } from "@/services";

export type UserRole = NonNullable<(typeof user.$inferSelect)["role"]>;

// Shown until an administrator saves the mosque profile.
const FALLBACK_MOSQUE_NAME = "Masjid";

export async function getMosqueName() {
  const [profile] = await db.select({ name: mosque.name }).from(mosque).limit(1);
  return profile?.name ?? FALLBACK_MOSQUE_NAME;
}
