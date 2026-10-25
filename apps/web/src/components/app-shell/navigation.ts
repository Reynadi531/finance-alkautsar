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

import type { UserRole } from "@/server/mosque";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  /** Omitted while the destination screen is not built yet; the item renders disabled. */
  to?: LinkProps["to"];
  /** Extra path prefixes that also highlight this item (e.g. sibling tabs of one screen). */
  activePaths?: readonly string[];
  roles: readonly UserRole[];
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
      {
        label: "Uang Masuk",
        icon: ArrowUpRight,
        to: "/dashboard/transaksi/masuk",
        roles: financeStaff,
      },
      {
        label: "Uang Keluar",
        icon: ArrowDownLeft,
        to: "/dashboard/transaksi/keluar",
        roles: financeStaff,
      },
      {
        label: "Tipe Transaksi",
        icon: Rows3,
        to: "/dashboard/tipe-pemasukan",
        activePaths: ["/dashboard/tipe-pengeluaran"],
        roles: adminOnly,
      },
      { label: "Laporan Kas", icon: Columns3, to: "/dashboard/laporan", roles: financeStaff },
    ],
  },
  {
    label: "Administrasi",
    size: "compact",
    items: [
      { label: "Pengguna", icon: User, to: "/dashboard/pengguna", roles: adminOnly },
      {
        label: "Riwayat Perubahan",
        icon: Clock3,
        to: "/dashboard/change-log",
        roles: financeStaff,
      },
      { label: "Pengaturan Masjid", icon: Settings, to: "/dashboard/pengaturan", roles: adminOnly },
    ],
  },
];

export function visibleSections(role: UserRole | undefined) {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => role !== undefined && item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  treasurer: "Bendahara",
  viewer: "Pengurus",
};
