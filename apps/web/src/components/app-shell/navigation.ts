import type { LinkProps } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  Columns3,
  LayoutGrid,
  Rows3,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

import type { MemberRole } from "@/server/mosque-access";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  /** Omitted while the destination screen is not built yet; the item renders disabled. */
  to?: LinkProps["to"];
  roles: readonly MemberRole[];
};

export type NavSection = {
  label: string;
  size: "default" | "compact";
  items: readonly NavItem[];
};

const allMembers = ["admin", "treasurer", "viewer"] as const;
const financeStaff = ["admin", "treasurer"] as const;
const adminOnly = ["admin"] as const;

export const navSections: readonly NavSection[] = [
  {
    label: "Menu utama",
    size: "default",
    items: [
      { label: "Dashboard", icon: LayoutGrid, to: "/dashboard", roles: allMembers },
      { label: "Uang Masuk", icon: ArrowUpRight, roles: financeStaff },
      { label: "Uang Keluar", icon: ArrowDownLeft, roles: financeStaff },
      { label: "Tipe Transaksi", icon: Rows3, roles: adminOnly },
      { label: "Laporan Kas", icon: Columns3, roles: financeStaff },
    ],
  },
  {
    label: "Administrasi",
    size: "compact",
    items: [
      { label: "Pengguna", icon: User, roles: adminOnly },
      { label: "Riwayat Perubahan", icon: Clock3, roles: financeStaff },
      { label: "Pengaturan Masjid", icon: Settings, roles: adminOnly },
    ],
  },
];

export function visibleSections(role: MemberRole | undefined) {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => role !== undefined && item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}

export const roleLabels: Record<MemberRole, string> = {
  admin: "Administrator",
  treasurer: "Bendahara",
  viewer: "Peninjau",
};
