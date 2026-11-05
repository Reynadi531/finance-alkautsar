import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import type { ReactNode } from "react";

import { DataTable, Td, Th, Tr } from "@/components/data-table";
import { Panel, PanelHeader } from "@/components/panel";
import type { ReportKind } from "@/components/report/report-query";
import { TablePagination } from "@/components/table-pagination";
import { formatTableDate } from "@/lib/date-range";
import { formatRupiah } from "@/lib/money";

export type LedgerTableRow = {
  id: string;
  ref: string;
  kind: "income" | "expense";
  effectiveDate: string;
  label: string;
  categoryName: string;
  amount: number;
  balance: number;
};

const subtitles: Record<ReportKind, string> = {
  all: "Seluruh pemasukan dan pengeluaran pada periode terpilih",
  income: "Pemasukan pada periode terpilih · saldo tetap menghitung seluruh transaksi kas",
  expense: "Pengeluaran pada periode terpilih · saldo tetap menghitung seluruh transaksi kas",
};

const emptyMessages: Record<ReportKind, string> = {
  all: "Tidak ada transaksi pada periode ini. Saldo akhir sama dengan saldo awal.",
  income: "Tidak ada pemasukan pada periode ini.",
  expense: "Tidak ada pengeluaran pada periode ini.",
};

const cell = "px-3 py-[18px] text-xs leading-[19px] text-ink";
const dash = <span aria-label="tidak ada">—</span>;

function Amount({
  kind,
  amount,
  bold,
}: {
  kind: "income" | "expense";
  amount: number;
  bold?: boolean;
}) {
  return (
    <span
      className={cn(
        "whitespace-nowrap tabular-nums",
        kind === "income" ? "text-income" : "text-expense",
        bold && "font-semibold",
      )}
    >
      {kind === "income" ? "+" : "−"} {formatRupiah(amount)}
    </span>
  );
}

function BalanceRow({
  date,
  label,
  income,
  expense,
  balance,
  emphasis,
}: {
  date: ReactNode;
  label: ReactNode;
  income?: ReactNode;
  expense?: ReactNode;
  balance: number;
  /** "bottom" marks the closing row (semibold, tinted). */
  emphasis?: "bottom";
}) {
  const bold = emphasis === "bottom" && "font-semibold";
  return (
    <Tr className={cn(emphasis === "bottom" && "bg-empty-surface")}>
      <Td className={cn(cell, "whitespace-nowrap", bold)}>{date}</Td>
      <Td className={cn(cell, bold)}>{label}</Td>
      <Td className={cn(cell, bold)}>{dash}</Td>
      <Td className={cn(cell, "text-income", bold)}>{income ?? dash}</Td>
      <Td className={cn(cell, "text-expense", bold)}>{expense ?? dash}</Td>
      <Td className={cn(cell, "whitespace-nowrap tabular-nums", bold)}>{formatRupiah(balance)}</Td>
    </Tr>
  );
}

/** Mobile stand-in for a table row: label/value pairs in a small card. */
function EntryCard({
  title,
  lines,
  tinted,
}: {
  title: ReactNode;
  lines: { label: string; value: ReactNode; className?: string }[];
  tinted?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-lg p-4",
        tinted ? "bg-empty-surface" : "border border-line bg-white",
      )}
    >
      <p className="text-xs font-semibold text-ink">{title}</p>
      {lines.map((line) => (
        <div key={line.label} className="flex items-center justify-between gap-4">
          <span className="text-xs text-ink-muted">{line.label}</span>
          <span
            className={cn(
              "text-right text-[13px] font-semibold text-ink tabular-nums",
              line.className,
            )}
          >
            {line.value}
          </span>
        </div>
      ))}
    </li>
  );
}

/**
 * "Rincian arus kas": opening (or carried) balance, one page of ledger rows with running
 * balances computed server-side over the whole period, and the closing row on the last page.
 */
export function LedgerTable({
  kind,
  from,
  to,
  rows,
  total,
  page,
  pageSize,
  openingBalance,
  carriedBalance,
  closingBalance,
  shownIncome,
  shownExpense,
  onPageChange,
}: {
  kind: ReportKind;
  from: string;
  to: string;
  rows: readonly LedgerTableRow[];
  total: number;
  page: number;
  pageSize: number;
  openingBalance: number;
  carriedBalance: number;
  closingBalance: number;
  shownIncome: number;
  shownExpense: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const isLastPage = page >= pageCount;

  const openingDate = page === 1 ? formatTableDate(from) : null;

  return (
    <Panel aria-labelledby="ledger-title" className="gap-5 p-6">
      <PanelHeader
        titleId="ledger-title"
        title="Rincian arus kas"
        description={subtitles[kind]}
        action={<p className="shrink-0 pt-1.5 text-[11px] text-ink-muted">{total} transaksi</p>}
      />

      <div className="hidden sm:block">
        <DataTable aria-describedby="ledger-title" className="min-w-[860px]">
          <thead>
            <tr>
              <Th className="w-[14%] py-[18px] leading-4 font-semibold">Tanggal</Th>
              <Th className="w-[24%] py-[18px] leading-4 font-semibold">Keterangan</Th>
              <Th className="w-[15%] py-[18px] leading-4 font-semibold">Kategori</Th>
              <Th className="w-[15%] py-[18px] leading-4 font-semibold">Pemasukan</Th>
              <Th className="w-[16%] py-[18px] leading-4 font-semibold">Pengeluaran</Th>
              <Th className="w-[16%] py-[18px] leading-4 font-semibold">Saldo</Th>
            </tr>
          </thead>
          <tbody>
            {page === 1 ? (
              <BalanceRow
                date={formatTableDate(from)}
                label="Saldo awal periode"
                balance={openingBalance}
              />
            ) : (
              <BalanceRow
                date={dash}
                label={
                  <span className="font-normal text-ink-muted italic">
                    Saldo pindahan dari halaman {page - 1}
                  </span>
                }
                balance={carriedBalance}
              />
            )}
            {rows.map((row) => (
              <Tr key={row.id}>
                <Td className={cn(cell, "whitespace-nowrap")}>
                  {formatTableDate(row.effectiveDate)}
                </Td>
                <Td className={cell}>
                  <span className="block">{row.label}</span>
                  <span className="sr-only">Nomor referensi {row.ref}</span>
                </Td>
                <Td className={cell}>{row.categoryName}</Td>
                <Td className={cell}>
                  {row.kind === "income" ? <Amount kind="income" amount={row.amount} /> : dash}
                </Td>
                <Td className={cell}>
                  {row.kind === "expense" ? <Amount kind="expense" amount={row.amount} /> : dash}
                </Td>
                <Td className={cn(cell, "whitespace-nowrap tabular-nums")}>
                  {formatRupiah(row.balance)}
                </Td>
              </Tr>
            ))}
            {total === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-14 text-center text-[13px] text-ink-muted">
                  {emptyMessages[kind]}
                </td>
              </tr>
            ) : null}
            {isLastPage ? (
              <BalanceRow
                emphasis="bottom"
                date={formatTableDate(to)}
                label="Saldo akhir periode"
                income={
                  kind === "expense" ? undefined : (
                    <Amount kind="income" amount={shownIncome} bold />
                  )
                }
                expense={
                  kind === "income" ? undefined : (
                    <Amount kind="expense" amount={shownExpense} bold />
                  )
                }
                balance={closingBalance}
              />
            ) : null}
          </tbody>
        </DataTable>
      </div>

      <ul aria-labelledby="ledger-title" className="flex flex-col gap-3 sm:hidden">
        <EntryCard
          tinted
          title={
            openingDate
              ? `${openingDate} · Saldo awal periode`
              : `Saldo pindahan dari halaman ${page - 1}`
          }
          lines={[
            { label: "Kategori", value: dash },
            { label: "Pemasukan", value: dash, className: "text-income" },
            { label: "Pengeluaran", value: dash, className: "text-expense" },
            { label: "Saldo", value: formatRupiah(page === 1 ? openingBalance : carriedBalance) },
          ]}
        />
        {rows.map((row) => (
          <EntryCard
            key={row.id}
            title={
              <>
                {formatTableDate(row.effectiveDate)} · {row.label}
                <span className="sr-only"> Nomor referensi {row.ref}</span>
              </>
            }
            lines={[
              { label: "Kategori", value: row.categoryName },
              row.kind === "income"
                ? {
                    label: "Pemasukan",
                    value: <Amount kind="income" amount={row.amount} />,
                  }
                : {
                    label: "Pengeluaran",
                    value: <Amount kind="expense" amount={row.amount} />,
                  },
              { label: "Saldo", value: formatRupiah(row.balance) },
            ]}
          />
        ))}
        {total === 0 ? (
          <li className="px-2 py-4 text-center text-xs leading-[22px] text-ink-muted">
            {emptyMessages[kind]}
          </li>
        ) : null}
        {isLastPage ? (
          <EntryCard
            tinted
            title={`${formatTableDate(to)} · Saldo akhir periode`}
            lines={[
              ...(kind === "expense"
                ? []
                : [
                    {
                      label: "Pemasukan",
                      value: <Amount kind="income" amount={shownIncome} />,
                    },
                  ]),
              ...(kind === "income"
                ? []
                : [
                    {
                      label: "Pengeluaran",
                      value: <Amount kind="expense" amount={shownExpense} />,
                    },
                  ]),
              { label: "Saldo", value: formatRupiah(closingBalance) },
            ]}
          />
        ) : null}
      </ul>

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        noun="transaksi"
        onPageChange={onPageChange}
        className="pt-0"
      />
    </Panel>
  );
}
