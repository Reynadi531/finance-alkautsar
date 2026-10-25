import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUp, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

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

function SummaryCard({
  label,
  badge,
  value,
  valueClassName,
  caption,
}: {
  label: string;
  badge?: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  caption: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-white p-5">
      <div className="flex min-h-[23px] items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.08em] text-ink-label uppercase">{label}</p>
        {badge}
      </div>
      <p
        className={cn(
          "truncate font-display text-[23px] font-bold text-ink tabular-nums",
          valueClassName,
        )}
      >
        {value}
      </p>
      <div className="text-xs text-ink-muted">{caption}</div>
    </div>
  );
}

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
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-[5px] text-[11px] font-bold tabular-nums",
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

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,420fr)_minmax(0,330fr)_minmax(0,330fr)]">
      <SummaryCard
        label={`${copy.totalLabel} · ${periodLabel}`}
        badge={
          previous ? (
            <ChangeBadge kind={kind} current={current.total} previous={previous.total} />
          ) : null
        }
        value={formatRupiah(current.total)}
        valueClassName={cn("text-[27px]", kind === "income" ? "text-income" : "text-expense")}
        caption={`Dari ${current.count} transaksi tercatat ${scope}`}
      />
      <SummaryCard
        label="Transaksi tercatat"
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
      <SummaryCard
        label="Rata-rata per transaksi"
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
  const tone = kind === "income" ? "text-income" : "text-expense";
  return (
    <section
      aria-label="Wawasan singkat"
      className={cn(
        "flex flex-col gap-3 rounded-[10px] px-5 py-4 sm:min-h-[88px] sm:flex-row sm:items-center sm:justify-between",
        kind === "income" ? "bg-income-surface" : "bg-expense-surface",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className={cn("text-[13px] font-bold", tone)}>{copy.insightTitle(topCategory.name)}</p>
        <p className="text-xs text-ink-muted">
          {copy.insightVerb} {formatRupiah(topCategory.amount)} atau{" "}
          {shareFormat.format(topCategory.share)} dari {copy.noun} {scopeLabel}.
        </p>
      </div>
      {showCategoryLink ? (
        <Link
          to={copy.categoryRoute}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded text-xs font-bold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30",
            tone,
          )}
        >
          {copy.categoryLinkLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}
