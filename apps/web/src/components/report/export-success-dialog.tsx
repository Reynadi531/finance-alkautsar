import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@keuangan-alkautsar/ui/components/dialog";
import { ArrowLeft, CircleCheck, FileSpreadsheet, FileText } from "lucide-react";
import { useRef } from "react";

import { ActionButton } from "@/components/action-button";
import { saveBlob, type ExportedReport } from "@/components/report/export-dialog";
import { InfoNote } from "@/components/info-note";
import { formatFileSize, reportTitle } from "@/components/report/report-query";

/** "Laporan siap diunduh": confirms the generated file and offers a re-download. */
export function ExportSuccessDialog({
  open,
  report,
  mosqueName,
  onClose,
}: {
  open: boolean;
  /** Kept after closing so the content stays visible during the exit animation. */
  report: ExportedReport | null;
  mosqueName: string;
  onClose: () => void;
}) {
  const Icon = report?.format === "pdf" ? FileText : FileSpreadsheet;
  const doneRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open && report !== null} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent
        showCloseButton={false}
        initialFocus={doneRef}
        className="flex w-full flex-col gap-[22px] rounded-[14px] bg-white p-6 text-ink shadow-2xl ring-0 sm:max-w-[600px] sm:p-[30px]"
      >
        {report ? (
          <>
            <div className="flex size-[52px] items-center justify-center rounded-full bg-action">
              <CircleCheck className="size-[26px] text-income" aria-hidden />
            </div>
            <div className="flex flex-col gap-3">
              <DialogTitle className="font-display text-[26px] font-semibold text-ink">
                Laporan siap diunduh
              </DialogTitle>
              <DialogDescription className="text-xs leading-5 text-ink-muted">
                Laporan kas {reportTitle(mosqueName, report.query)}
              </DialogDescription>
            </div>

            <div className="flex min-h-[70px] items-center justify-between gap-3 rounded-lg border border-line bg-empty-surface px-4 py-3">
              <div className="flex min-w-0 items-center gap-[11px]">
                <Icon className="size-[22px] shrink-0 text-income" aria-hidden />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate text-xs font-semibold text-ink" title={report.fileName}>
                    {report.fileName}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {report.format.toUpperCase()} · {report.rows} transaksi ·{" "}
                    {formatFileSize(report.blob.size)}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-xs font-semibold text-income">Siap</p>
            </div>

            <InfoNote icon={false} className="rounded-lg p-3 text-xs">
              Data file mengikuti filter, urutan transaksi, dan perhitungan saldo yang tampil pada
              laporan.
            </InfoNote>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 self-start rounded-md text-xs font-semibold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-action/30"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Kembali ke laporan kas
              </button>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <ActionButton tone="outline" onClick={() => saveBlob(report.blob, report.fileName)}>
                  Unduh ulang
                </ActionButton>
                <ActionButton ref={doneRef} tone="brand" onClick={onClose}>
                  Selesai
                </ActionButton>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
