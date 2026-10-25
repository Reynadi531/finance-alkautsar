import { cn } from "@keuangan-alkautsar/ui/lib/utils";

import { roleLabels } from "@/components/app-shell/navigation";

const toneClassName = {
  balance: "text-(--color-balance)",
  income: "text-income",
  neutral: "text-count",
} as const;

/** Horizontal stat tile from S07: large figure left, title and caption right. */
function SummaryTile({
  value,
  label,
  caption,
  tone,
}: {
  value: number;
  label: string;
  caption: string;
  tone: keyof typeof toneClassName;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-[10px] bg-white px-5 py-[19px]">
      <p
        className={cn(
          "font-display text-[30px] leading-[41px] font-bold tabular-nums",
          toneClassName[tone],
        )}
      >
        {value}
      </p>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-[13px] font-bold text-ink">{label}</p>
        <p className="text-[11px] text-ink-label">{caption}</p>
      </div>
    </div>
  );
}

export function UserSummary({
  stats,
}: {
  stats: { total: number; active: number; admins: number };
}) {
  return (
    <section aria-label="Ringkasan pengguna" className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      <SummaryTile
        value={stats.total}
        label="Total pengguna"
        caption="Terdaftar di masjid"
        tone="balance"
      />
      <SummaryTile
        value={stats.active}
        label="Aktif"
        caption="Dapat mengakses sistem"
        tone="income"
      />
      <SummaryTile
        value={stats.admins}
        label="Admin"
        caption="Akses penuh ke pengaturan"
        tone="neutral"
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
      className="flex flex-col gap-[11px] rounded-[10px] bg-info-surface px-[22px] py-[19px]"
    >
      <h2 id="role-guide-title" className="font-display text-[15px] font-bold text-[#1D3D63]">
        Hak akses sesuai peran
      </h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
        {permissions.map((item) => (
          <div key={item.role} className="flex flex-col gap-[5px]">
            <dt className="text-xs font-bold text-(--color-balance)">{roleLabels[item.role]}</dt>
            <dd className="text-[11px] text-info-foreground/85">{item.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
