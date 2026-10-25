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

const cell = "px-3 py-3 text-[11px] text-ink-body";
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
        bold && "font-bold",
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
  /** "bottom" marks the closing row (bold, separated from the rows above). */
  emphasis?: "bottom";
}) {
  return (
    <Tr className={cn(emphasis === "bottom" && "border-t-2 border-t-line bg-canvas/60")}>
      <Td className={cn(cell, "whitespace-nowrap")}>{date}</Td>
      <Td className={cn(cell, "text-xs", emphasis === "bottom" && "font-bold text-ink")}>
        {label}
      </Td>
      <Td className={cell}>{dash}</Td>
      <Td className={cn(cell, "text-income")}>{income ?? dash}</Td>
      <Td className={cn(cell, "text-expense")}>{expense ?? dash}</Td>
      <Td className={cn(cell, "font-bold whitespace-nowrap text-ink tabular-nums")}>
        {formatRupiah(balance)}
      </Td>
    </Tr>
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

  return (
    <Panel aria-labelledby="ledger-title" className="sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <PanelHeader titleId="ledger-title" title="Rincian arus kas" />
        <p className="shrink-0 text-xs font-medium text-ink-muted">{total} transaksi</p>
      </div>
      <p className="mt-1.5 mb-1 text-xs text-ink-subtle">{subtitles[kind]}</p>

      <DataTable aria-describedby="ledger-title" className="min-w-[860px]">
        <thead>
          <tr>
            <Th className="w-[11%] px-3">Tanggal</Th>
            <Th className="w-[27%] px-3">Keterangan</Th>
            <Th className="w-[16%] px-3">Kategori</Th>
            <Th className="w-[15%] px-3">Pemasukan</Th>
            <Th className="w-[15%] px-3">Pengeluaran</Th>
            <Th className="w-[16%] px-3">Saldo</Th>
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
            <Tr key={row.id} className="border-line/70">
              <Td className={cn(cell, "whitespace-nowrap")}>
                {formatTableDate(row.effectiveDate)}
              </Td>
              <Td className={cn(cell, "text-xs")}>
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
              <Td className={cn(cell, "font-bold whitespace-nowrap text-ink tabular-nums")}>
                {formatRupiah(row.balance)}
              </Td>
            </Tr>
          ))}
          {total === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-[13px] text-ink-muted">
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
                kind === "expense" ? undefined : <Amount kind="income" amount={shownIncome} bold />
              }
              expense={
                kind === "income" ? undefined : <Amount kind="expense" amount={shownExpense} bold />
              }
              balance={closingBalance}
            />
          ) : null}
        </tbody>
      </DataTable>

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        noun="transaksi"
        onPageChange={onPageChange}
      />
    </Panel>
  );
}
