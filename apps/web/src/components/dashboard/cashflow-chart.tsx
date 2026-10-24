import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { useState } from "react";

import { Panel, PanelHeader } from "@/components/panel";
import { formatMonthShort, formatMonthSpan } from "@/lib/date-range";
import { formatRupiah } from "@/lib/money";

export type MonthlyFlow = { month: string; income: number; expense: number };

const series = [
  { key: "income", label: "Pemasukan", swatch: "bg-chart-income" },
  { key: "expense", label: "Pengeluaran", swatch: "bg-chart-expense" },
] as const;

const monthLong = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function monthLabel(iso: string) {
  return monthLong.format(new Date(`${iso}T00:00:00Z`));
}

export function CashflowChart({ data }: { data: MonthlyFlow[] }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const max = Math.max(0, ...data.flatMap((row) => [row.income, row.expense]));
  const hasData = max > 0;
  const span = data.length ? formatMonthSpan(data[0].month, data[data.length - 1].month) : "";

  return (
    <Panel aria-labelledby="cashflow-title" className="gap-3.5 lg:min-h-[330px]">
      <PanelHeader
        titleId="cashflow-title"
        title="Arus kas bulanan"
        description={`Pemasukan dan pengeluaran · ${span}`}
        action={
          hasData ? (
            <button
              type="button"
              onClick={() => setView(view === "chart" ? "table" : "chart")}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-link outline-none hover:bg-action focus-visible:ring-2 focus-visible:ring-income/30"
            >
              {view === "chart" ? "Lihat tabel" : "Lihat grafik"}
            </button>
          ) : null
        }
      />

      {!hasData ? (
        <div className="flex flex-1 items-center justify-center rounded-lg bg-action px-6 py-12 text-center text-[13px] text-ink-muted">
          Belum ada pemasukan atau pengeluaran dalam {data.length} bulan terakhir.
        </div>
      ) : view === "table" ? (
        <CashflowTable data={data} />
      ) : (
        <>
          <ul className="flex flex-wrap gap-4 text-xs text-ink-body" aria-label="Keterangan">
            {series.map((item) => (
              <li key={item.key} className="flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-[3px]", item.swatch)} aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
          <div
            role="img"
            aria-label={`Grafik batang pemasukan dan pengeluaran ${span}. Gunakan "Lihat tabel" untuk angka lengkap.`}
            className="flex h-[220px] items-end gap-2 px-2 pt-3 sm:gap-[17px]"
          >
            {data.map((row) => (
              <MonthColumn key={row.month} row={row} max={max} />
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

function barHeight(value: number, max: number) {
  if (value <= 0) return "0px";
  // Keep tiny but non-zero months visible.
  return `max(2px, ${(value / max) * 100}%)`;
}

function MonthColumn({ row, max }: { row: MonthlyFlow; max: number }) {
  return (
    <div className="group relative flex h-full min-w-0 flex-1 flex-col items-center gap-[5px]">
      <div
        tabIndex={0}
        aria-label={`${monthLabel(row.month)}: pemasukan ${formatRupiah(row.income)}, pengeluaran ${formatRupiah(row.expense)}`}
        className="flex w-full flex-1 items-end justify-center gap-0.5 rounded-md border-b border-line outline-none hover:bg-action focus-visible:bg-action focus-visible:ring-2 focus-visible:ring-income/30"
      >
        <span
          className="w-5 rounded-t-[4px] bg-chart-income sm:w-6"
          style={{ height: barHeight(row.income, max) }}
        />
        <span
          className="w-5 rounded-t-[4px] bg-chart-expense sm:w-6"
          style={{ height: barHeight(row.expense, max) }}
        />
      </div>
      <span className="text-[11px] text-ink-muted">{formatMonthShort(row.month)}</span>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max -translate-x-1/2 flex-col gap-1 rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg group-focus-within:flex group-hover:flex"
      >
        <p className="font-bold">{monthLabel(row.month)}</p>
        {series.map((item) => (
          <p key={item.key} className="flex items-center gap-1.5 tabular-nums">
            <span className={cn("size-2 rounded-[2px]", item.swatch)} />
            {item.label}: {formatRupiah(row[item.key])}
          </p>
        ))}
      </div>
    </div>
  );
}

function CashflowTable({ data }: { data: MonthlyFlow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px] text-ink-body">
        <caption className="sr-only">Pemasukan dan pengeluaran per bulan</caption>
        <thead className="text-[11px] font-bold tracking-wide text-ink-label uppercase">
          <tr className="border-b border-line">
            <th scope="col" className="py-2 font-bold">
              Bulan
            </th>
            <th scope="col" className="py-2 text-right font-bold">
              Pemasukan
            </th>
            <th scope="col" className="py-2 text-right font-bold">
              Pengeluaran
            </th>
            <th scope="col" className="py-2 text-right font-bold">
              Selisih
            </th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {data.map((row) => (
            <tr key={row.month} className="border-b border-line last:border-0">
              <th scope="row" className="py-2 font-sans font-normal">
                {monthLabel(row.month)}
              </th>
              <td className="py-2 text-right">{formatRupiah(row.income)}</td>
              <td className="py-2 text-right">{formatRupiah(row.expense)}</td>
              <td className="py-2 text-right">{formatRupiah(row.income - row.expense)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
