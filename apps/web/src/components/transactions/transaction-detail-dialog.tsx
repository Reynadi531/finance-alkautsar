import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { ArrowUpRight, FileText } from "lucide-react";
import type { ReactNode } from "react";

import { ActionButton } from "@/components/action-button";
import { AppDialog } from "@/components/app-dialog";
import { formatLongDate, todayIso } from "@/lib/date-range";
import { formatRupiah } from "@/lib/money";

import { kindCopy, type TransactionKind } from "./model";
import type { TransactionListRow } from "./transaction-table";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5">
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className="text-right text-[13px] font-bold text-ink">{children}</dd>
    </div>
  );
}

/** Read-only view of one transaction with its proof file and a shortcut to edit it. */
export function TransactionDetailDialog({
  kind,
  open,
  onOpenChange,
  row,
  onEdit,
}: {
  kind: TransactionKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: TransactionListRow | null;
  onEdit: (row: TransactionListRow) => void;
}) {
  const copy = kindCopy[kind];
  if (!row) return null;
  const recordedOn = todayIso(new Date(row.createdAt));

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[580px]"
      title={`Detail ${copy.noun}`}
      description={`${row.ref}  ·  Dicatat ${formatLongDate(recordedOn)}`}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ActionButton tone="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </ActionButton>
          <ActionButton tone={kind} onClick={() => onEdit(row)}>
            Edit transaksi
          </ActionButton>
        </div>
      }
    >
      <div className="flex flex-col">
        <div
          className={cn(
            "flex flex-col gap-2 rounded-[10px] px-[18px] py-5",
            kind === "income" ? "bg-income-surface text-income" : "bg-expense-surface text-expense",
          )}
        >
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase">{copy.totalLabel}</p>
          <p className="font-display text-[28px] leading-tight font-bold tabular-nums">
            {formatRupiah(row.amount)}
          </p>
        </div>

        <dl className="mt-2">
          <DetailRow label="Tanggal transaksi">{formatLongDate(row.effectiveDate)}</DetailRow>
          <DetailRow label={copy.typeLabel}>
            {row.categoryName}
            {row.categoryArchived ? (
              <span className="ml-1 font-normal text-ink-muted">(diarsipkan)</span>
            ) : null}
          </DetailRow>
          <DetailRow label="Metode pembayaran">{row.paymentMethod ?? "Tidak dicatat"}</DetailRow>
          {kind === "expense" ? (
            <DetailRow label="Penerima">{row.recipient ?? "Tidak dicatat"}</DetailRow>
          ) : null}
        </dl>

        <div className="flex flex-col gap-1.5 pt-4">
          <p className="text-xs font-bold text-ink">Keterangan</p>
          <p className="text-[13px] whitespace-pre-line text-ink-body">
            {row.description ?? <span className="text-ink-muted">Tidak ada keterangan.</span>}
          </p>
        </div>

        {row.proofFileId ? (
          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-line bg-canvas px-4 py-4">
            <FileText className="size-[18px] shrink-0 text-ink-muted" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-ink">
              {row.proofFileName}
            </span>
            <a
              href={`/api/files/${row.proofFileId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded text-xs font-bold text-info-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              Lihat bukti
              <ArrowUpRight className="size-3.5" aria-hidden />
              <span className="sr-only">(tab baru)</span>
            </a>
          </div>
        ) : (
          <p className="mt-4 rounded-[10px] border border-dashed border-line px-4 py-3 text-xs text-ink-muted">
            Belum ada bukti transaksi.
          </p>
        )}
      </div>
    </AppDialog>
  );
}
