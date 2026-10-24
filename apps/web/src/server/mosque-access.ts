import { mosque, mosqueMember } from "@keuangan-alkautsar/db/schema/finance";
import { getCookie } from "@tanstack/react-start/server";
import { asc, eq } from "drizzle-orm";

import { db } from "@/services";

export const ACTIVE_MOSQUE_COOKIE = "active_mosque";

export type MemberRole = (typeof mosqueMember.$inferSelect)["role"];

export type Membership = {
  mosqueId: string;
  mosqueName: string;
  role: MemberRole;
};

export async function listMemberships(userId: string): Promise<Membership[]> {
  return db
    .select({ mosqueId: mosque.id, mosqueName: mosque.name, role: mosqueMember.role })
    .from(mosqueMember)
    .innerJoin(mosque, eq(mosque.id, mosqueMember.mosqueId))
    .where(eq(mosqueMember.userId, userId))
    .orderBy(asc(mosque.name));
}

/**
 * Resolves the selected mosque on the server. The cookie is only a preference:
 * it is honored only when the user is still a member of that mosque.
 */
export async function resolveActiveMembership(userId: string) {
  const memberships = await listMemberships(userId);
  const preferred = getCookie(ACTIVE_MOSQUE_COOKIE);
  const active =
    memberships.find((membership) => membership.mosqueId === preferred) ?? memberships[0] ?? null;
  return { memberships, active };
}
