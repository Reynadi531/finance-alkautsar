import { Wallet } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { formatLongDate } from "@/lib/date-range";
import { formatRupiah } from "@/lib/money";

/** SALDO AWAL / PEMASUKAN / PENGELUARAN / SALDO AKHIR for the selected period. */
export function ReportSummary({
  from,
  openingBalance,
  income,
  expense,
  incomeCount,
  expenseCount,
  closingBalance,
}: {
  from: string;
  openingBalance: number;
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
  closingBalance: number;
}) {
  const net = closingBalance - openingBalance;
  const change =
    net > 0
      ? `Naik ${formatRupiah(net)}`
      : net < 0
        ? `Turun ${formatRupiah(-net)}`
        : "Tidak berubah dari saldo awal";

  return (
    <section
      aria-label="Ringkasan saldo"
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
    >
      <StatCard
        label="Saldo awal"
        value={formatRupiah(openingBalance)}
        caption={`Per ${formatLongDate(from)}`}
        tone="neutral"
        icon={Wallet}
      />
      <StatCard
        label="Pemasukan"
        value={formatRupiah(income)}
        caption={`${incomeCount} transaksi masuk`}
        tone="income"
        icon={Wallet}
      />
      <StatCard
        label="Pengeluaran"
        value={formatRupiah(expense)}
        caption={`${expenseCount} transaksi keluar`}
        tone="expense"
        icon={Wallet}
      />
      <StatCard
        label="Saldo akhir"
        value={formatRupiah(closingBalance)}
        caption={<span title="Perubahan dibanding saldo awal periode">{change}</span>}
        tone="balance"
        icon={Wallet}
      />
    </section>
  );
}
