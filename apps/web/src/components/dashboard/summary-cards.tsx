import { ArrowDown, ArrowUp } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { formatRupiah } from "@/lib/money";

type Totals = { income: number; expense: number; count: number };

function ComparisonCaption({
  current,
  previous,
  periodLabel,
}: {
  current: number;
  previous: number;
  periodLabel: string;
}) {
  if (previous === 0) {
    return <>Tidak ada data {periodLabel}</>;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) {
    return <>Sama dengan {periodLabel}</>;
  }
  const Icon = change > 0 ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-3" aria-hidden />
      <span className="sr-only">{change > 0 ? "Naik" : "Turun"}</span>
      {Math.abs(change)}% dari {periodLabel}
    </span>
  );
}

export function SummaryCards({
  current,
  previous,
  closingBalance,
  isFullMonth,
}: {
  current: Totals;
  previous: Totals;
  closingBalance: number;
  isFullMonth: boolean;
}) {
  const periodLabel = isFullMonth ? "bulan lalu" : "periode sebelumnya";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Pemasukan"
        tone="income"
        value={formatRupiah(current.income)}
        caption={
          <ComparisonCaption
            current={current.income}
            previous={previous.income}
            periodLabel={periodLabel}
          />
        }
      />
      <StatCard
        label="Pengeluaran"
        tone="expense"
        value={formatRupiah(current.expense)}
        caption={
          <ComparisonCaption
            current={current.expense}
            previous={previous.expense}
            periodLabel={periodLabel}
          />
        }
      />
      <StatCard
        label="Saldo kas"
        tone="balance"
        value={formatRupiah(closingBalance)}
        caption="Saldo penutupan"
      />
      <StatCard label="Transaksi" value={current.count} caption="Dalam periode ini" />
    </div>
  );
}
