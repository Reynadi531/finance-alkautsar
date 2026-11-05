import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { formatRupiah } from "@/lib/money";

import {
  formatMonth,
  formatMonthName,
  kindCopy,
  type MonthParam,
  type TransactionKind,
} from "./model";

type Totals = { total: number; count: number };

const percentFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: "exceptZero",
});

function ChangeBadge({
  kind,
  current,
  previous,
}: {
  kind: TransactionKind;
  current: number;
  previous: number;
}) {
  if (previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  const Icon = change >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        kind === "income" ? "bg-income-surface text-income" : "bg-expense-surface text-expense",
      )}
    >
      <Icon className="size-3" aria-hidden />
      <span className="sr-only">{change >= 0 ? "Naik" : "Turun"} dibanding bulan sebelumnya:</span>
      {percentFormat.format(change).replace("-", "−")}%
    </span>
  );
}

function CountCaption({
  current,
  previous,
  previousMonth,
}: {
  current: number;
  previous: number;
  previousMonth: string;
}) {
  const delta = current - previous;
  const monthName = formatMonthName(previousMonth);
  if (delta === 0) return <>Sama seperti {monthName}</>;
  const Icon = delta > 0 ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-3" aria-hidden />
      <span className="sr-only">{delta > 0 ? "Bertambah" : "Berkurang"}</span>
      {Math.abs(delta)} transaksi dari {monthName}
    </span>
  );
}

/** Three cards for the selected month: total (with % change), count (with delta), average. */
export function TransactionSummary({
  kind,
  month,
  isCurrentMonth,
  previousMonth,
  current,
  previous,
}: {
  kind: TransactionKind;
  month: MonthParam;
  isCurrentMonth: boolean;
  previousMonth: string | null;
  current: Totals;
  previous: Totals | null;
}) {
  const copy = kindCopy[kind];
  const periodLabel = month === "all" ? "semua bulan" : formatMonthName(month);
  const average = current.count > 0 ? Math.round(current.total / current.count) : 0;
  const scope =
    month === "all"
      ? "secara keseluruhan"
      : isCurrentMonth
        ? "bulan ini"
        : `pada ${formatMonth(month)}`;

  const totalCaption = `Dari ${current.count} transaksi tercatat ${scope}`;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        label={`${copy.totalLabel} · ${periodLabel}`}
        icon={kind === "income" ? ArrowUpRight : ArrowDownLeft}
        tone={kind === "income" ? "neutral" : "expense"}
        value={formatRupiah(current.total)}
        caption={
          previous && previous.total > 0 ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <ChangeBadge kind={kind} current={current.total} previous={previous.total} />
              <span>{totalCaption}</span>
            </span>
          ) : (
            totalCaption
          )
        }
      />
      <StatCard
        label="Transaksi tercatat"
        icon={ReceiptText}
        value={current.count}
        caption={
          previous && previousMonth ? (
            <CountCaption
              current={current.count}
              previous={previous.count}
              previousMonth={previousMonth}
            />
          ) : (
            "Semua transaksi yang tercatat"
          )
        }
      />
      <StatCard
        label="Rata-rata per transaksi"
        icon={Wallet}
        value={formatRupiah(average)}
        caption="Dalam periode terpilih"
      />
    </div>
  );
}

const shareFormat = new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 0 });

/** Tinted band naming the biggest category of the period. Hidden when there is no data. */
export function TransactionInsight({
  kind,
  topCategory,
  scopeLabel,
  showCategoryLink,
}: {
  kind: TransactionKind;
  topCategory: { name: string; amount: number; share: number } | null;
  scopeLabel: string;
  showCategoryLink: boolean;
}) {
  if (!topCategory) return null;
  const copy = kindCopy[kind];
  return (
    <section
      aria-label="Wawasan singkat"
      className="flex flex-col gap-3 rounded-lg border border-[#DBE4D5] bg-info-surface p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-[13px] font-semibold text-ink-strong">
          {copy.insightTitle(topCategory.name)}
        </p>
        <p className="text-xs leading-5 text-info-foreground">
          {copy.insightVerb} {formatRupiah(topCategory.amount)} atau{" "}
          {shareFormat.format(topCategory.share)} dari {copy.noun} {scopeLabel}.
        </p>
      </div>
      {showCategoryLink ? (
        <Link
          to={copy.categoryRoute}
          className="inline-flex shrink-0 items-center gap-1.5 rounded text-xs font-semibold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-action/30"
        >
          {copy.categoryLinkLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}
