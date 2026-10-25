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
        className="flex w-full flex-col gap-[18px] rounded-2xl bg-white p-6 text-ink shadow-2xl ring-0 sm:max-w-[600px] sm:p-[30px]"
      >
        {report ? (
          <>
            <div className="flex size-[52px] items-center justify-center rounded-full bg-income-surface">
              <CircleCheck className="size-[26px] text-income" aria-hidden />
            </div>
            <div className="flex flex-col gap-3">
              <DialogTitle className="font-display text-[23px] font-bold text-ink">
                Laporan siap diunduh
              </DialogTitle>
              <DialogDescription className="text-[13px] text-ink-muted">
                Laporan kas {reportTitle(mosqueName, report.query)}
              </DialogDescription>
            </div>

            <div className="flex min-h-[70px] items-center justify-between gap-3 rounded-lg border border-line bg-canvas/60 px-[15px] py-3">
              <div className="flex min-w-0 items-center gap-[11px]">
                <Icon className="size-[22px] shrink-0 text-income" aria-hidden />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate text-[11px] font-bold text-ink" title={report.fileName}>
                    {report.fileName}
                  </p>
                  <p className="text-[10px] text-ink-muted">
                    {report.format.toUpperCase()} · {report.rows} transaksi ·{" "}
                    {formatFileSize(report.blob.size)}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-[11px] font-bold text-income">Siap</p>
            </div>

            <InfoNote icon={false} className="rounded-[7px] p-3 text-[11px]">
              Data file mengikuti filter, urutan transaksi, dan perhitungan saldo yang tampil pada
              laporan.
            </InfoNote>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 self-start rounded-md text-xs font-bold text-info-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Kembali ke laporan kas
              </button>
              <div className="flex flex-col-reverse gap-[9px] sm:flex-row">
                <ActionButton
                  tone="outline"
                  className="h-[37px] rounded-[7px] px-4 text-xs"
                  onClick={() => saveBlob(report.blob, report.fileName)}
                >
                  Unduh ulang
                </ActionButton>
                <ActionButton
                  ref={doneRef}
                  className="h-[37px] rounded-[7px] px-4 text-xs"
                  onClick={onClose}
                >
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
