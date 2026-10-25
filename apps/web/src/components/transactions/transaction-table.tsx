import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@keuangan-alkautsar/ui/components/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
      <span className="inline-flex rounded-[5px] bg-canvas px-[9px] py-[5px] text-[10px] font-bold text-ink-subtle">
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
      className="inline-flex rounded-[5px] bg-info-surface px-[9px] py-[5px] text-[10px] font-bold text-info-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
    >
      {label}
    </a>
  );
}

/** Transaction list for S02/S03. Rows offer "Lihat" plus a menu with edit and delete. */
export function TransactionTable({
  rows,
  emptyMessage,
  onView,
  onEdit,
  onDelete,
}: {
  rows: readonly TransactionListRow[];
  emptyMessage: ReactNode;
  onView: (row: TransactionListRow) => void;
  onEdit: (row: TransactionListRow) => void;
  onDelete: (row: TransactionListRow) => void;
}) {
  return (
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
                  <span className="text-xs font-bold text-ink">{row.categoryName}</span>
                  <span className="text-[10px] text-ink-subtle">{row.ref}</span>
                </div>
              </Td>
              <Td>
                <SignedAmount kind={row.kind} amount={row.amount} className="font-sans" />
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
                <div className="flex items-center gap-1 text-[11px] font-bold text-ink-body">
                  <button
                    type="button"
                    onClick={() => onView(row)}
                    className="rounded px-1 py-1 outline-none hover:text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
                    aria-label={`Lihat ${row.categoryName} ${row.ref}`}
                  >
                    Lihat
                  </button>
                  <span aria-hidden className="text-ink-subtle">
                    ·
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="flex h-6 w-7 items-center justify-center rounded outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand/30 data-popup-open:bg-canvas"
                      aria-label={`Aksi lain untuk ${row.ref}`}
                    >
                      <MoreHorizontal className="size-4" aria-hidden />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 rounded-lg bg-white p-1 text-ink shadow-lg ring-1 ring-line"
                    >
                      <DropdownMenuItem
                        className="rounded-md text-[13px]"
                        onClick={() => onEdit(row)}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        className="rounded-md text-[13px]"
                        onClick={() => onDelete(row)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Td>
            </Tr>
          ))
        )}
      </tbody>
    </DataTable>
  );
}
