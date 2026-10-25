import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Panel, PanelHeader } from "@/components/panel";
import { SignedAmount } from "@/components/signed-amount";
import { formatShortDate } from "@/lib/date-range";

export type RecentTransaction = {
  id: string;
  kind: "income" | "expense";
  effectiveDate: string;
  amount: number;
  description: string | null;
  categoryName: string;
};

const kindLabels = { income: "Pemasukan", expense: "Pengeluaran" } as const;

export function RecentTransactions({
  transactions,
  showReportLink,
}: {
  transactions: RecentTransaction[];
  /** The full list lives in the cash report, which viewers cannot open. */
  showReportLink: boolean;
}) {
  return (
    <Panel aria-labelledby="recent-title" className="gap-3 sm:p-5">
      <PanelHeader
        titleId="recent-title"
        title="Transaksi terbaru"
        action={
          showReportLink ? (
            <Link
              to="/dashboard/laporan"
              className="flex shrink-0 items-center gap-1.5 rounded text-xs font-bold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-income/40"
            >
              Lihat semua
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null
        }
      />

      {transactions.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-muted">
          Belum ada transaksi yang tercatat hingga akhir periode ini.
        </p>
      ) : (
        <ul className="flex flex-col">
          {transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <p className="flex min-w-0 flex-wrap items-center gap-x-3 text-[13px] text-ink-body">
                <time dateTime={transaction.effectiveDate} className="whitespace-nowrap">
                  {formatShortDate(transaction.effectiveDate)}
                </time>
                <span aria-hidden>·</span>
                <span className="min-w-0 truncate">
                  {transaction.description || transaction.categoryName}
                </span>
                <span aria-hidden>·</span>
                <span>{kindLabels[transaction.kind]}</span>
              </p>
              <SignedAmount kind={transaction.kind} amount={transaction.amount} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
