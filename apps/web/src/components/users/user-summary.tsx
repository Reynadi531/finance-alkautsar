import { ShieldCheck, UserCheck, Users } from "lucide-react";

import { roleLabels } from "@/components/app-shell/navigation";
import { StatCard } from "@/components/stat-card";

export function UserSummary({
  stats,
}: {
  stats: { total: number; active: number; admins: number };
}) {
  return (
    <section aria-label="Ringkasan pengguna" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Total pengguna"
        value={stats.total}
        caption="Terdaftar di masjid"
        icon={Users}
      />
      <StatCard
        label="Aktif"
        value={stats.active}
        caption="Dapat mengakses sistem"
        icon={UserCheck}
      />
      <StatCard
        label="Admin"
        value={stats.admins}
        caption="Akses penuh ke pengaturan"
        icon={ShieldCheck}
      />
    </section>
  );
}

const permissions = [
  { role: "admin", text: "Kelola pengguna & pengaturan" },
  { role: "treasurer", text: "Catat dan kelola transaksi" },
  { role: "viewer", text: "Lihat laporan keuangan" },
] as const;

/** "Hak akses sesuai peran" explainer below the user list. */
export function RoleGuide() {
  return (
    <section
      aria-labelledby="role-guide-title"
      className="flex flex-col gap-5 rounded-[10px] bg-info-surface p-6"
    >
      <h2
        id="role-guide-title"
        className="font-display text-[17px] font-semibold text-action-foreground"
      >
        Hak akses sesuai peran
      </h2>
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-6">
        {permissions.map((item) => (
          <div key={item.role} className="flex flex-col gap-2">
            <dt className="text-[13px] font-semibold text-action-foreground">
              {roleLabels[item.role]}
            </dt>
            <dd className="text-xs leading-[22px] text-info-icon">{item.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
