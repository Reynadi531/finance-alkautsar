import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { CalendarDays, FileSpreadsheet, FileText } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { ActionButton } from "@/components/action-button";
import { AppDialog, AppDialogFooter } from "@/components/app-dialog";
import { errorId, fieldControlClassName, FormField } from "@/components/form-field";
import { InfoNote } from "@/components/info-note";
import {
  invalidRangeMessage,
  reportKindLabels,
  reportKinds,
  reportTitle,
  type ReportFormat,
  type ReportKind,
  type ReportQuery,
} from "@/components/report/report-query";
import { getReportRowCount } from "@/functions/report";

export type ExportedReport = {
  blob: Blob;
  fileName: string;
  format: ReportFormat;
  rows: number;
  query: ReportQuery;
};

/** Saves a downloaded blob through a temporary object URL. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function fileNameFrom(disposition: string | null, fallback: string) {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return disposition?.match(/filename="([^"]+)"/i)?.[1] ?? fallback;
}

const formats: { value: ReportFormat; label: string; detail: string; icon: typeof FileText }[] = [
  { value: "xlsx", label: "Excel", detail: "XLSX · lembar kerja", icon: FileSpreadsheet },
  { value: "pdf", label: "PDF", detail: "PDF · siap dibagikan", icon: FileText },
];

function SectionLegend({ children }: { children: ReactNode }) {
  return <legend className="mb-3 text-[13px] font-bold text-ink-strong">{children}</legend>;
}

/**
 * "Ekspor laporan kas": format, period, scope, and running-balance option. Generates the file
 * server-side (same computation as the screen), downloads it, and hands it to `onExported`.
 */
export function ExportDialog({
  open,
  onOpenChange,
  mosqueName,
  initialQuery,
  initialCount,
  onExported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mosqueName: string;
  initialQuery: ReportQuery;
  /** Row count of `initialQuery`, already known from the screen. */
  initialCount: number;
  onExported: (report: ExportedReport) => void;
}) {
  const id = useId();
  const [format, setFormat] = useState<ReportFormat>("xlsx");
  const [from, setFrom] = useState(initialQuery.from);
  const [to, setTo] = useState(initialQuery.to);
  const [kind, setKind] = useState<ReportKind>(initialQuery.kind);
  const [running, setRunning] = useState(true);
  const [dateError, setDateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState<number | null>(initialCount);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  // Reset to the screen's filter each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setFormat("xlsx");
    setFrom(initialQuery.from);
    setTo(initialQuery.to);
    setKind(initialQuery.kind);
    setRunning(true);
    setDateError(null);
    setSubmitError(null);
    setPending(false);
    setCount(initialCount);
  }, [open, initialQuery.from, initialQuery.to, initialQuery.kind, initialCount]);

  const validRange = Boolean(from && to && from <= to);
  const sameAsScreen =
    from === initialQuery.from && to === initialQuery.to && kind === initialQuery.kind;

  // Keep the footer count in step with the chosen period and scope.
  useEffect(() => {
    if (!open || !validRange) return;
    if (sameAsScreen) {
      setCount(initialCount);
      return;
    }
    let cancelled = false;
    setCount(null);
    const timer = setTimeout(() => {
      getReportRowCount({ data: { from, to, kind } })
        .then((value) => {
          if (!cancelled) setCount(value);
        })
        .catch(() => {
          if (!cancelled) setCount(null);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, from, to, kind, validRange, sameAsScreen, initialCount]);

  async function submit() {
    setSubmitError(null);
    if (!from || !to) {
      setDateError("Isi tanggal mulai dan tanggal akhir.");
      (from ? toRef : fromRef).current?.focus();
      return;
    }
    if (to < from) {
      setDateError(invalidRangeMessage);
      toRef.current?.focus();
      return;
    }
    setDateError(null);
    setPending(true);
    try {
      const params = new URLSearchParams({ format, from, to, kind, running: running ? "1" : "0" });
      const response = await fetch(`/api/laporan/export?${params}`, { credentials: "same-origin" });
      if (!response.ok) {
        const message = (await response.text()).trim();
        throw new Error(message || "Laporan gagal dibuat.");
      }
      const blob = await response.blob();
      const fileName = fileNameFrom(
        response.headers.get("Content-Disposition"),
        `Laporan-Kas.${format}`,
      );
      const rows = Number(response.headers.get("X-Report-Rows") ?? count ?? 0);
      saveBlob(blob, fileName);
      onExported({ blob, fileName, format, rows, query: { from, to, kind } });
    } catch (error) {
      setSubmitError(
        error instanceof TypeError
          ? "Koneksi terputus. Periksa jaringan Anda, lalu coba lagi."
          : error instanceof Error
            ? error.message
            : "Laporan gagal dibuat.",
      );
    } finally {
      setPending(false);
    }
  }

  const eyebrow = validRange ? reportTitle(mosqueName, { from, to }) : mosqueName;
  const dateInputClassName = cn(
    fieldControlClassName,
    "h-[42px] rounded-[7px] border-line text-xs [&::-webkit-calendar-picker-indicator]:opacity-0",
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
      title="Ekspor laporan kas"
      description="Pilih format dan cakupan laporan yang akan diunduh."
      className="sm:max-w-[660px]"
      footer={
        <AppDialogFooter
          note={
            <span aria-live="polite">
              {validRange ? (count === null ? "Menghitung transaksi…" : `${count} transaksi`) : "—"}
              {" · "}
              {sameAsScreen ? "Periode terpilih" : "Periode khusus"}
            </span>
          }
        >
          <ActionButton
            tone="outline"
            className="h-[37px] rounded-[7px] px-[15px] text-xs"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Batal
          </ActionButton>
          <ActionButton
            type="submit"
            form={`${id}-form`}
            className="h-[37px] rounded-[7px] px-[15px] text-xs"
            pending={pending}
          >
            {pending ? "Menyiapkan…" : "Unduh laporan"}
          </ActionButton>
        </AppDialogFooter>
      }
    >
      <form
        id={`${id}-form`}
        noValidate
        className="flex flex-col gap-[18px]"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <p className="text-[11px] font-bold tracking-[0.04em] whitespace-pre-wrap text-ink-body uppercase">
          {eyebrow.replace(" · ", "  ·  ")}
        </p>

        <fieldset>
          <SectionLegend>Format berkas</SectionLegend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {formats.map((option) => {
              const Icon = option.icon;
              const checked = format === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer flex-col gap-[7px] rounded-lg border bg-white p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-income/30",
                    checked
                      ? "border-2 border-income bg-income-surface p-[11px]"
                      : "border-line hover:bg-canvas",
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-format`}
                    value={option.value}
                    checked={checked}
                    onChange={() => setFormat(option.value)}
                    className="sr-only"
                  />
                  <Icon
                    className={cn("size-[18px]", checked ? "text-income" : "text-ink-muted")}
                    aria-hidden
                  />
                  <span className="text-[13px] font-bold text-ink">{option.label}</span>
                  <span className="text-[10px] text-ink-muted">{option.detail}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <SectionLegend>Periode laporan</SectionLegend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {(
              [
                ["from", "Dari tanggal", from, setFrom, fromRef],
                ["to", "Sampai tanggal", to, setTo, toRef],
              ] as const
            ).map(([key, label, value, setValue, ref]) => (
              <FormField
                key={key}
                id={`${id}-${key}`}
                label={<span className="text-[11px] text-ink-muted">{label}</span>}
                className="gap-1.5"
              >
                <div className="relative">
                  <input
                    ref={ref}
                    id={`${id}-${key}`}
                    type="date"
                    required
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value);
                      setDateError(null);
                    }}
                    aria-invalid={dateError && (key === "to" || !from) ? true : undefined}
                    aria-describedby={dateError ? errorId(`${id}-dates`) : undefined}
                    className={dateInputClassName}
                  />
                  <CalendarDays
                    className="pointer-events-none absolute top-1/2 right-3 size-[15px] -translate-y-1/2 text-ink-muted"
                    aria-hidden
                  />
                </div>
              </FormField>
            ))}
          </div>
          {dateError ? (
            <p id={errorId(`${id}-dates`)} role="alert" className="mt-2 text-xs text-expense">
              {dateError}
            </p>
          ) : null}
        </fieldset>

        <fieldset>
          <SectionLegend>Cakupan data</SectionLegend>
          <div className="flex flex-wrap gap-2">
            {reportKinds.map((value) => {
              const checked = kind === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-center gap-[7px] rounded-[7px] border px-2.5 py-2 text-[11px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-income/30",
                    checked
                      ? "border-income bg-income-surface font-bold text-income"
                      : "border-line bg-white text-ink-body hover:bg-canvas",
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-kind`}
                    value={value}
                    checked={checked}
                    onChange={() => setKind(value)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-2.5 items-center justify-center rounded-full border border-current",
                    )}
                  >
                    {checked ? <span className="size-1.5 rounded-full bg-current" /> : null}
                  </span>
                  {reportKindLabels[value]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-center gap-2.5 text-xs text-ink-body">
          <input
            type="checkbox"
            checked={running}
            onChange={(event) => setRunning(event.target.checked)}
            className="size-[17px] cursor-pointer rounded-[3px] accent-income"
          />
          Sertakan saldo awal periode dan saldo berjalan
        </label>

        <InfoNote icon={false} className="rounded-[7px] p-3 text-[11px]">
          Ekspor menggunakan baris dan perhitungan yang sama dengan laporan di layar.
        </InfoNote>

        {submitError ? (
          <p
            role="alert"
            className="rounded-lg bg-expense-surface px-3.5 py-3 text-xs text-expense"
          >
            {submitError}
          </p>
        ) : null}
      </form>
    </AppDialog>
  );
}
