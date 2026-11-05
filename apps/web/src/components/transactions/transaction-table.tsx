import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@keuangan-alkautsar/ui/components/dropdown-menu";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { DataTable, TableMessage, Td, Th, Tr } from "@/components/data-table";
import { SignedAmount } from "@/components/signed-amount";
import type { TransactionPageData } from "@/functions/transactions";
import { formatTableDate } from "@/lib/date-range";

import { proofTypeLabel } from "./model";

export type TransactionListRow = TransactionPageData["rows"][number];

const COLUMN_COUNT = 7;

/** Attachment indicator: file type badge linking to the proof, or a muted dash. */
export function ProofBadge({ row }: { row: TransactionListRow }) {
  const label = proofTypeLabel(row.proofMimeType);
  if (!row.proofFileId || !label) {
    return (
      <span className="inline-flex rounded-[5px] bg-muted-surface px-[9px] py-[5px] text-[10px] font-bold text-ink-subtle">
        <span aria-hidden>—</span>
        <span className="sr-only">Tanpa bukti</span>
      </span>
    );
  }
  return (
    <a
      href={`/api/files/${row.proofFileId}`}
      target="_blank"
      rel="noreferrer"
      title={row.proofFileName ?? undefined}
      aria-label={`Buka bukti ${label} ${row.proofFileName ?? ""}`}
      className="inline-flex rounded-[5px] bg-info-surface px-[9px] py-[5px] text-[10px] font-bold text-ink-strong outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-action/30"
    >
      {label}
    </a>
  );
}

type RowHandlers = {
  onView: (row: TransactionListRow) => void;
  onEdit: (row: TransactionListRow) => void;
  onDelete: (row: TransactionListRow) => void;
};

/** "Lihat" link plus an overflow menu with edit and delete. */
function RowActions({ row, onView, onEdit, onDelete }: RowHandlers & { row: TransactionListRow }) {
  return (
    <div className="flex items-center gap-1 text-[12px] font-semibold text-ink-strong">
      <button
        type="button"
        onClick={() => onView(row)}
        className="rounded px-1 py-1 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-action/30"
        aria-label={`Lihat ${row.categoryName} ${row.ref}`}
      >
        Lihat
      </button>
      <span aria-hidden className="text-ink-subtle">
        ·
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-8 items-center justify-center rounded-md text-ink-body outline-none hover:bg-muted-surface focus-visible:ring-2 focus-visible:ring-primary-action/30 data-popup-open:bg-muted-surface"
          aria-label={`Aksi lain untuk ${row.ref}`}
        >
          <Ellipsis className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 text-ink">
          <DropdownMenuItem onClick={() => onEdit(row)}>
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
            <Trash2 className="size-3.5" aria-hidden />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Mobile card for one transaction (design: "tampilan kartu"). */
function TransactionCard({ row, ...handlers }: RowHandlers & { row: TransactionListRow }) {
  return (
    <li className="flex flex-col gap-3 rounded-[10px] border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-[13px] font-semibold text-ink">{row.categoryName}</span>
          <span className="text-[11px] text-ink-muted">
            {row.ref} · {formatTableDate(row.effectiveDate)}
          </span>
        </div>
        <SignedAmount kind={row.kind} amount={row.amount} className="text-sm" />
      </div>
      {row.description || (row.kind === "expense" && row.recipient) ? (
        <div className="flex flex-col gap-0.5 text-xs leading-5 text-ink-body">
          {row.description ? <p className="line-clamp-2">{row.description}</p> : null}
          {row.kind === "expense" && row.recipient ? (
            <p className="text-ink-muted">Penerima: {row.recipient}</p>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex items-center gap-2 text-[11px] text-ink-muted">
          {row.paymentMethod ? <span>{row.paymentMethod}</span> : null}
          <ProofBadge row={row} />
        </div>
        <RowActions row={row} {...handlers} />
      </div>
    </li>
  );
}

/**
 * Transaction list for S02/S03. Desktop (lg+) is a table; below that it is a stack of cards.
 * Rows offer "Lihat" plus a menu with edit and delete.
 */
export function TransactionTable({
  rows,
  emptyMessage,
  onView,
  onEdit,
  onDelete,
}: RowHandlers & {
  rows: readonly TransactionListRow[];
  emptyMessage: ReactNode;
}) {
  const handlers = { onView, onEdit, onDelete };
  return (
    <>
      <div className="hidden lg:block">
        <DataTable className="min-w-[860px]">
          <thead>
            <tr>
              <Th className="w-[112px]">Tanggal</Th>
              <Th className="w-[185px]">Kategori</Th>
              <Th className="w-[165px]">Jumlah</Th>
              <Th className="w-[125px]">Metode</Th>
              <Th>Keterangan</Th>
              <Th className="w-[105px]">Bukti</Th>
              <Th className="w-[100px]">Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <TableMessage colSpan={COLUMN_COUNT}>{emptyMessage}</TableMessage>
            ) : (
              rows.map((row) => (
                <Tr key={row.id}>
                  <Td className="whitespace-nowrap">{formatTableDate(row.effectiveDate)}</Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-ink">{row.categoryName}</span>
                      <span className="text-[10px] text-ink-subtle">{row.ref}</span>
                    </div>
                  </Td>
                  <Td>
                    <SignedAmount kind={row.kind} amount={row.amount} />
                  </Td>
                  <Td>{row.paymentMethod ?? <span className="text-ink-subtle">—</span>}</Td>
                  <Td className="max-w-[260px]">
                    <p className="truncate" title={row.description ?? undefined}>
                      {row.description ?? <span className="text-ink-subtle">—</span>}
                    </p>
                    {row.kind === "expense" && row.recipient ? (
                      <p className="mt-0.5 truncate text-[11px] text-ink-subtle">
                        Penerima: {row.recipient}
                      </p>
                    ) : null}
                  </Td>
                  <Td>
                    <ProofBadge row={row} />
                  </Td>
                  <Td>
                    <RowActions row={row} {...handlers} />
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </DataTable>
      </div>

      <div className="lg:hidden">
        {rows.length === 0 ? (
          <div className="px-3 py-12 text-center text-[13px] leading-[23px] text-ink-muted">
            {emptyMessage}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <TransactionCard key={row.id} row={row} {...handlers} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
