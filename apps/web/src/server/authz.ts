import type { Session } from "@keuangan-alkautsar/auth";

import type { UserRole } from "@/server/mosque";

export const financeStaff = ["admin", "treasurer"] as const satisfies readonly UserRole[];
export const adminOnly = ["admin"] as const satisfies readonly UserRole[];
export const allMembers = ["admin", "treasurer", "viewer"] as const satisfies readonly UserRole[];

/**
 * Server-side guard for server functions behind `authMiddleware`.
 * Returns the signed-in user when their role is allowed, otherwise throws.
 */
export function requireRole(session: Session | null, roles: readonly UserRole[]) {
  if (!session) {
    throw new Error("Sesi berakhir. Silakan masuk kembali.");
  }
  const role = session.user.role;
  if (!role || !roles.includes(role)) {
    throw new Error("Anda tidak memiliki akses untuk tindakan ini.");
  }
  return { ...session.user, role };
}
