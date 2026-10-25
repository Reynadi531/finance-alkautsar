import type { LinkProps } from "@tanstack/react-router";
import z from "zod";

export type CategoryKind = "income" | "expense";

export const categoryStatusSchema = z.enum(["all", "active", "archived"]);
export type CategoryStatus = z.infer<typeof categoryStatusSchema>;

/** URL search params shared by both category screens. */
export const categorySearchSchema = z.object({
  status: categoryStatusSchema.optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
});
export type CategorySearch = z.infer<typeof categorySearchSchema>;

/** Collapse inner whitespace so "Infaq  Jumat " and "infaq jumat" compare equal. */
export function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

/** Form + server validation for the add/edit dialog. */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .transform(normalizeCategoryName)
    .pipe(
      z.string().min(1, "Nama tipe wajib diisi.").max(60, "Nama tipe paling banyak 60 karakter."),
    ),
  code: z
    .string()
    .transform((code) => code.trim().toUpperCase())
    .pipe(
      z
        .string()
        .min(1, "Kode tipe wajib diisi.")
        .max(20, "Kode tipe paling banyak 20 karakter.")
        .regex(/^[A-Z0-9][A-Z0-9-]*$/, "Kode hanya boleh berisi huruf, angka, dan tanda hubung."),
    ),
  note: z.string().trim().max(300, "Catatan paling banyak 300 karakter."),
});
export type CategoryFormValues = z.input<typeof categoryFormSchema>;

/** Screen copy per kind; both pages render the same component with this config. */
export const categoryKinds = {
  income: {
    kind: "income",
    to: "/dashboard/tipe-pemasukan",
    codePrefix: "PM",
    title: "Tipe pemasukan",
    tabLabel: "Pemasukan",
    noun: "pemasukan",
    description:
      "Kelola pengelompokan dana masuk agar laporan kas tetap rapi dan mudah ditelusuri.",
    activeCaption: "Siap dipakai saat mencatat",
    usedLabel: "Dipakai bulan ini",
    usedCaption: (count: number) => `Dari ${count} transaksi`,
    archivedCaption: "Tidak muncul di formulir",
    searchPlaceholder: "Cari nama atau kode tipe pemasukan...",
    namePlaceholder: "Contoh: Donasi pembangunan",
    notePlaceholder: "Keterangan penggunaan tipe...",
    transactionLabel: "uang masuk",
  },
  expense: {
    kind: "expense",
    to: "/dashboard/tipe-pengeluaran",
    codePrefix: "PK",
    title: "Tipe pengeluaran",
    tabLabel: "Pengeluaran",
    noun: "pengeluaran",
    description:
      "Tentukan kategori biaya operasional dan program untuk pencatatan pengeluaran yang konsisten.",
    activeCaption: "Dapat dipilih di transaksi",
    usedLabel: "Digunakan bulan ini",
    usedCaption: (count: number) => `Mencakup ${count} transaksi`,
    archivedCaption: "Riwayat tetap tersimpan",
    searchPlaceholder: "Cari nama atau kode tipe pengeluaran...",
    namePlaceholder: "Contoh: Perawatan fasilitas",
    notePlaceholder: "Keterangan penggunaan tipe pengeluaran...",
    transactionLabel: "uang keluar",
  },
} as const satisfies Record<
  CategoryKind,
  { kind: CategoryKind; to: LinkProps["to"]; codePrefix: string; [key: string]: unknown }
>;

export type CategoryKindConfig = (typeof categoryKinds)[CategoryKind];
