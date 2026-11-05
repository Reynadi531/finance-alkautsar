import { Link } from "@tanstack/react-router";
import { ArrowRight, ReceiptText } from "lucide-react";

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
    <Panel aria-labelledby="recent-title" className="gap-5">
      <PanelHeader
        titleId="recent-title"
        title="Transaksi terbaru"
        action={
          showReportLink ? (
            <Link
              to="/dashboard/laporan"
              className="-my-2 flex min-h-12 shrink-0 items-center gap-2 rounded text-[11px] font-semibold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-action/40 lg:min-h-8 lg:text-xs"
            >
              Lihat semua
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null
        }
      />

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 border-t border-line py-10">
          <ReceiptText className="size-7 text-ink-subtle" aria-hidden />
          <p className="text-center text-xs leading-5 text-ink-muted lg:text-[13px] lg:leading-[22px]">
            Belum ada transaksi pada periode ini.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col border-t border-line">
          {transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="flex flex-col gap-1 border-b border-line py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
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
