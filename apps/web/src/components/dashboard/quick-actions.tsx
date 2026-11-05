import { Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight, Minus, Plus, Tags, type LucideIcon } from "lucide-react";

import { Panel, PanelHeader } from "@/components/panel";
import type { UserRole } from "@/server/mosque";

type QuickAction = {
  label: string;
  icon: LucideIcon;
  link:
    | {
        to: "/dashboard/transaksi/masuk" | "/dashboard/transaksi/keluar";
        search: { add: 1 };
      }
    | { to: "/dashboard/laporan" | "/dashboard/tipe-pemasukan" };
  roles: readonly UserRole[];
};

const actions: readonly QuickAction[] = [
  {
    label: "Catat pemasukan",
    icon: Plus,
    link: { to: "/dashboard/transaksi/masuk", search: { add: 1 } },
    roles: ["admin", "treasurer"],
  },
  {
    label: "Catat pengeluaran",
    icon: Minus,
    link: { to: "/dashboard/transaksi/keluar", search: { add: 1 } },
    roles: ["admin", "treasurer"],
  },
  {
    label: "Buka laporan kas",
    icon: BookOpen,
    link: { to: "/dashboard/laporan" },
    roles: ["admin", "treasurer"],
  },
  {
    label: "Kelola kategori",
    icon: Tags,
    link: { to: "/dashboard/tipe-pemasukan" },
    roles: ["admin"],
  },
];

export function QuickActions({ role }: { role: UserRole }) {
  const visible = actions.filter((action) => action.roles.includes(role));
  if (visible.length === 0) return null;

  return (
    <Panel aria-labelledby="quick-actions-title" className="gap-3">
      <PanelHeader titleId="quick-actions-title" title="Aksi cepat" />
      <ul className="flex flex-col gap-3">
        {visible.map(({ label, icon: Icon, link }) => (
          <li key={label}>
            <Link
              {...link}
              className="flex h-[52px] items-center gap-3 rounded-lg bg-action px-4 text-[13px] font-semibold text-action-foreground outline-none hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-primary-action/40 lg:h-12"
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
