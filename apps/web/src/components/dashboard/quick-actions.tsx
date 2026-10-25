import { Link } from "@tanstack/react-router";
import { Plus, Rows3, Settings, type LucideIcon } from "lucide-react";

import { Panel, PanelHeader } from "@/components/panel";
import type { UserRole } from "@/server/mosque";

type QuickAction = {
  label: string;
  icon: LucideIcon;
  link:
    | { to: "/dashboard/transaksi/masuk" | "/dashboard/transaksi/keluar"; search: { add: 1 } }
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
    icon: Plus,
    link: { to: "/dashboard/transaksi/keluar", search: { add: 1 } },
    roles: ["admin", "treasurer"],
  },
  {
    label: "Buka laporan kas",
    icon: Rows3,
    link: { to: "/dashboard/laporan" },
    roles: ["admin", "treasurer"],
  },
  {
    label: "Kelola kategori",
    icon: Settings,
    link: { to: "/dashboard/tipe-pemasukan" },
    roles: ["admin"],
  },
];

export function QuickActions({ role }: { role: UserRole }) {
  const visible = actions.filter((action) => action.roles.includes(role));
  if (visible.length === 0) return null;

  return (
    <Panel aria-labelledby="quick-actions-title" className="gap-[15px]">
      <PanelHeader titleId="quick-actions-title" title="Aksi cepat" />
      <ul className="flex flex-col gap-[15px]">
        {visible.map(({ label, icon: Icon, link }) => (
          <li key={label}>
            <Link
              {...link}
              className="flex items-center gap-2 rounded-lg bg-action p-3.5 text-[13px] font-bold text-action-foreground outline-none hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-income/40"
            >
              <Icon className="size-3.5" aria-hidden />
              <span className="flex-1">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
