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
      className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        label="Saldo awal"
        value={formatRupiah(openingBalance)}
        caption={`Per ${formatLongDate(from)}`}
        tone="neutral"
      />
      <StatCard
        label="Pemasukan"
        value={formatRupiah(income)}
        caption={`${incomeCount} transaksi masuk`}
        tone="income"
      />
      <StatCard
        label="Pengeluaran"
        value={formatRupiah(expense)}
        caption={`${expenseCount} transaksi keluar`}
        tone="expense"
      />
      <StatCard
        label="Saldo akhir"
        value={formatRupiah(closingBalance)}
        caption={<span title="Perubahan dibanding saldo awal periode">{change}</span>}
        tone="balance"
      />
    </section>
  );
}
