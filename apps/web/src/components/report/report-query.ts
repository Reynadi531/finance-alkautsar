import z from "zod";

import { endOfMonth, formatRange, startOfMonth, type DateRange } from "@/lib/date-range";

/** Client-safe pieces of the S06 cash report shared by the screen, server, and export route. */

export const reportKinds = ["all", "income", "expense"] as const;
export type ReportKind = (typeof reportKinds)[number];

export const reportKindLabels: Record<ReportKind, string> = {
  all: "Semua transaksi",
  income: "Pemasukan",
  expense: "Pengeluaran",
};

export const reportFormats = ["xlsx", "pdf"] as const;
export type ReportFormat = (typeof reportFormats)[number];

export const invalidRangeMessage = "Tanggal akhir tidak boleh sebelum tanggal mulai.";

/** Inclusive date range + kind filter. */
export const reportQuerySchema = z
  .object({
    from: z.iso.date({ error: "Tanggal mulai tidak valid." }),
    to: z.iso.date({ error: "Tanggal akhir tidak valid." }),
    kind: z.enum(reportKinds, { error: "Cakupan data tidak valid." }).default("all"),
  })
  .refine((query) => query.from <= query.to, { message: invalidRangeMessage, path: ["to"] });

export type ReportQuery = DateRange & { kind: ReportKind };

const monthShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function isFullMonth({ from, to }: DateRange) {
  return from === startOfMonth(from) && to === endOfMonth(from);
}

/** "Laporan-Kas-Al-Kautsar-Okt-2026.xlsx", or with ISO dates for a custom range. */
export function reportFileName(mosqueName: string, query: ReportQuery, format: ReportFormat) {
  const mosque =
    mosqueName
      .replace(/^masjid\s+/i, "")
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-") || "Masjid";
  const period = isFullMonth(query)
    ? `${monthShort[Number(query.from.slice(5, 7)) - 1]}-${query.from.slice(0, 4)}`
    : query.from === query.to
      ? query.from
      : `${query.from}-sd-${query.to}`;
  const scope = query.kind === "all" ? "" : `-${reportKindLabels[query.kind]}`;
  return `Laporan-Kas-${mosque}-${period}${scope}.${format}`;
}

/** "Masjid Al-Kautsar · 1–31 Oktober 2026". */
export function reportTitle(mosqueName: string, range: DateRange) {
  return `${mosqueName} · ${formatRange(range)}`;
}

/** "84 KB" / "1,2 MB". */
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}
