import { Plus, Rows3, Settings, type LucideIcon } from "lucide-react";

import { Panel, PanelHeader } from "@/components/panel";
import type { UserRole } from "@/server/mosque";

type QuickAction = {
  label: string;
  icon: LucideIcon;
  roles: readonly UserRole[];
};

// Destinations (S02, S03, S06, S04) are not built yet, so each action renders disabled.
const actions: readonly QuickAction[] = [
  { label: "Catat pemasukan", icon: Plus, roles: ["admin", "treasurer"] },
  { label: "Catat pengeluaran", icon: Plus, roles: ["admin", "treasurer"] },
  { label: "Buka laporan kas", icon: Rows3, roles: ["admin", "treasurer"] },
  { label: "Kelola kategori", icon: Settings, roles: ["admin"] },
];

export function QuickActions({ role }: { role: UserRole }) {
  const visible = actions.filter((action) => action.roles.includes(role));
  if (visible.length === 0) return null;

  return (
    <Panel aria-labelledby="quick-actions-title" className="gap-[15px]">
      <PanelHeader titleId="quick-actions-title" title="Aksi cepat" />
      <ul className="flex flex-col gap-[15px]">
        {visible.map(({ label, icon: Icon }) => (
          <li key={label}>
            <span
              aria-disabled="true"
              title="Segera tersedia"
              className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-action p-3.5 text-[13px] font-bold text-action-foreground"
            >
              <Icon className="size-3.5" aria-hidden />
              <span className="flex-1">{label}</span>
              <span className="text-[11px] font-normal text-ink-muted">Segera</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
