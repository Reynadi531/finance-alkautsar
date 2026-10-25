import z from "zod";

import { pageParam } from "@/lib/pagination";

/**
 * Shared rules and copy for the income (S02) and expense (S03) screens. Imported by both
 * the client components and the server functions, so it must stay free of server code.
 */

export type TransactionKind = "income" | "expense";

export const TRANSACTION_PAGE_SIZE = 5;

export const MAX_AMOUNT = 999_999_999_999;

export const paymentMethods = ["Tunai", "Transfer", "QRIS"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

/** Per-kind wording, routes and colours. Everything that differs between S02 and S03. */
export const kindCopy = {
  income: {
    title: "Uang Masuk",
    description: "Catat dan pantau setiap dana yang diterima masjid.",
    noun: "pemasukan",
    addLabel: "Tambah pemasukan",
    listTitle: "Daftar pemasukan",
    totalLabel: "Total pemasukan",
    typeLabel: "Tipe pemasukan",
    proofLabel: "Bukti transaksi",
    descriptionPlaceholder: "Tulis keterangan transaksi...",
    dialogDescription: (mosque: string) => `Catat dana masuk ke kas ${mosque}.`,
    insightTitle: (name: string) => `Sumber dana terbesar: ${name}`,
    insightVerb: "Menyumbang",
    categoryRoute: "/dashboard/tipe-pemasukan",
    categoryLinkLabel: "Lihat tipe pemasukan",
    path: "/dashboard/transaksi/masuk",
  },
  expense: {
    title: "Uang Keluar",
    description: "Kelola belanja operasional dan dokumentasi pengeluaran.",
    noun: "pengeluaran",
    addLabel: "Tambah pengeluaran",
    listTitle: "Daftar pengeluaran",
    totalLabel: "Total pengeluaran",
    typeLabel: "Tipe pengeluaran",
    proofLabel: "Bukti pengeluaran",
    descriptionPlaceholder: "Tulis keperluan pengeluaran...",
    dialogDescription: (mosque: string) => `Catat dana keluar dari kas ${mosque}.`,
    insightTitle: (name: string) => `Pengeluaran terbesar: ${name}`,
    insightVerb: "Mencapai",
    categoryRoute: "/dashboard/tipe-pengeluaran",
    categoryLinkLabel: "Lihat tipe pengeluaran",
    path: "/dashboard/transaksi/keluar",
  },
} as const satisfies Record<TransactionKind, unknown>;

// --- Month filter -------------------------------------------------------------------

/** `month` search param: "YYYY-MM", or "all" for every month. */
export const monthKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const monthParamSchema = z.union([monthKeySchema, z.literal("all")]);
export type MonthParam = z.infer<typeof monthParamSchema>;

export function monthOf(isoDate: string) {
  return isoDate.slice(0, 7);
}

export function monthRange(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

export function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
}

const monthYearFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthNameFormat = new Intl.DateTimeFormat("id-ID", { month: "long", timeZone: "UTC" });

/** "Oktober 2026". */
export function formatMonth(month: string) {
  return monthYearFormat.format(new Date(`${month}-01T00:00:00Z`));
}

/** "Oktober". */
export function formatMonthName(month: string) {
  return monthNameFormat.format(new Date(`${month}-01T00:00:00Z`));
}

// --- Search params ------------------------------------------------------------------

const looseString = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .optional()
  .catch(undefined);

/** Search params shared by both list routes (`?month=2026-10&q=infaq&page=2&add=1`). */
export const transactionSearchSchema = z.object({
  month: monthParamSchema.optional().catch(undefined),
  q: looseString,
  page: pageParam,
  /** Opens the add dialog on load (dashboard quick actions link here). */
  add: z
    .union([z.literal(1), z.literal("1"), z.literal(true)])
    .optional()
    .catch(undefined),
});
export type TransactionSearch = z.infer<typeof transactionSearchSchema>;

/**
 * The month the list shows. Without `month`, a deep link that only carries `q` (e.g. a
 * reference from the change log) searches every month; otherwise the current month.
 */
export function resolveMonth(search: TransactionSearch, currentMonth: string): MonthParam {
  if (search.month) return search.month;
  return search.q ? "all" : currentMonth;
}

// --- Amount -------------------------------------------------------------------------

/** Parses "500.000", "Rp 500.000" or "500000" into whole rupiah; null when not a whole number. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/^\s*rp\.?\s*/i, "").replace(/\s/g, "");
  if (!/^(\d{1,3}(\.\d{3})+|\d+)$/.test(cleaned)) return null;
  const value = Number(cleaned.replaceAll(".", ""));
  return Number.isSafeInteger(value) ? value : null;
}

/** Groups typed digits as the user types: "2450000" → "2.450.000". */
export function formatAmountInput(input: string) {
  const digits = input
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 13);
  return digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
}

export const amountFieldSchema = z.string().superRefine((value, ctx) => {
  if (!value.trim()) {
    ctx.addIssue({ code: "custom", message: "Jumlah wajib diisi." });
    return;
  }
  const amount = parseAmount(value);
  if (amount === null) {
    ctx.addIssue({
      code: "custom",
      message: "Masukkan jumlah rupiah tanpa desimal, mis. 500.000.",
    });
  } else if (amount <= 0) {
    ctx.addIssue({ code: "custom", message: "Jumlah harus lebih dari 0." });
  } else if (amount > MAX_AMOUNT) {
    ctx.addIssue({ code: "custom", message: "Jumlah terlalu besar." });
  }
});

/** Form values as typed; the server re-validates the same rules. */
export const transactionFormSchema = z.object({
  effectiveDate: z.iso.date("Pilih tanggal transaksi."),
  categoryId: z.string().min(1, "Pilih tipe transaksi."),
  amount: amountFieldSchema,
  paymentMethod: z.string(),
  recipient: z.string().max(120, "Penerima maksimal 120 karakter."),
  description: z.string().max(500, "Keterangan maksimal 500 karakter."),
});
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (paymentMethods as readonly string[]).includes(value);
}

// --- Proof files --------------------------------------------------------------------

const proofLabels: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};

export function proofTypeLabel(mimeType: string | null | undefined) {
  return mimeType ? (proofLabels[mimeType] ?? "Berkas") : null;
}

// --- Server function inputs (client-safe so validators can run on both sides) ------

export const transactionKindSchema = z.enum(["income", "expense"]);

export const transactionPageInputSchema = z.object({
  kind: transactionKindSchema,
  month: monthParamSchema,
  q: z.string().max(100).default(""),
  page: z.number().int().min(1).default(1),
});

/** Fields of the add/edit FormData after extraction; the server parses with this. */
export const saveFieldsSchema = z.object({
  id: z.string().optional(),
  kind: transactionKindSchema,
  effectiveDate: z.iso.date("Pilih tanggal transaksi."),
  categoryId: z.string().min(1, "Pilih tipe transaksi."),
  amount: amountFieldSchema,
  paymentMethod: z
    .string()
    .refine((value) => value === "" || isPaymentMethod(value), "Metode pembayaran tidak dikenal."),
  recipient: z.string().trim().max(120, "Penerima maksimal 120 karakter."),
  description: z.string().trim().max(500, "Keterangan maksimal 500 karakter."),
  removeProof: z.enum(["0", "1"]).default("0"),
});

export const MAX_IMPORT_CHARS = 5_000_000;

export const importInputSchema = z.object({
  kind: transactionKindSchema,
  fileName: z.string().max(255),
  text: z.string().max(MAX_IMPORT_CHARS, "Berkas terlalu besar."),
});
