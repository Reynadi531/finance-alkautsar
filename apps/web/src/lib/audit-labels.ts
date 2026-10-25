import { roleLabels } from "@/components/app-shell/navigation";
import { formatLongDate } from "@/lib/date-range";
import { formatRupiah } from "@/lib/money";
import { transactionKindLabels } from "@/lib/references";
import type { BadgeTone } from "@/components/status-badge";

// Labels and formatters for the change log (S08). Snapshot keys follow `AuditSnapshots`
// in server/audit.ts; only keys listed in `fieldLabels` are ever displayed or exported.

export const auditActions = ["create", "update", "delete", "archive", "restore"] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditEntities = ["transaction", "category", "user", "mosque", "report"] as const;
export type AuditEntity = (typeof auditEntities)[number];

export const actionLabels: Record<AuditAction, string> = {
  create: "Ditambahkan",
  update: "Diperbarui",
  delete: "Dihapus",
  archive: "Diarsipkan",
  restore: "Dipulihkan",
};

export const actionTones: Record<AuditAction, BadgeTone> = {
  create: "income",
  update: "brand",
  delete: "expense",
  archive: "neutral",
  restore: "neutral",
};

export const entityLabels: Record<AuditEntity, string> = {
  transaction: "Transaksi",
  category: "Kategori",
  user: "Pengguna",
  mosque: "Pengaturan",
  report: "Laporan",
};

/** Badge text for a row; a "created" report is an export, an archived user is deactivated. */
export function auditActionLabel(entity: AuditEntity, action: AuditAction) {
  if (entity === "report" && action === "create") return "Diekspor";
  if (entity === "user" && action === "archive") return "Dinonaktifkan";
  if (entity === "user" && action === "restore") return "Diaktifkan";
  return actionLabels[action];
}

export function auditActionTone(entity: AuditEntity, action: AuditAction): BadgeTone {
  return entity === "report" && action === "create" ? "neutral" : actionTones[action];
}

/** Area badge in the detail dialog. */
export function auditDomainLabel(entity: AuditEntity) {
  if (entity === "user") return "Pengguna";
  if (entity === "mosque") return "Pengaturan";
  return "Keuangan";
}

type Snapshot = Record<string, unknown> | null | undefined;

function snapshotKind(before: Snapshot, after: Snapshot): "income" | "expense" | null {
  const kind = after?.kind ?? before?.kind;
  return kind === "income" || kind === "expense" ? kind : null;
}

/** "Transaksi pemasukan", "Kategori pengeluaran", "Pengaturan masjid", … */
export function auditEntityTypeLabel(entity: AuditEntity, before: Snapshot, after: Snapshot) {
  const kind = snapshotKind(before, after);
  const kindWord = kind ? ` ${transactionKindLabels[kind].toLowerCase()}` : "";
  switch (entity) {
    case "transaction":
      return `Transaksi${kindWord}`;
    case "category":
      return `Kategori${kindWord}`;
    case "user":
      return "Pengguna";
    case "mosque":
      return "Pengaturan masjid";
    case "report":
      return "Laporan kas";
  }
}

/** Dialog title, e.g. "Pemasukan diperbarui", "Kategori pengeluaran diarsipkan". */
export function auditDetailTitle(
  entity: AuditEntity,
  action: AuditAction,
  before: Snapshot,
  after: Snapshot,
) {
  const verb = auditActionLabel(entity, action).toLowerCase();
  const kind = snapshotKind(before, after);
  if (entity === "transaction") {
    return `${kind ? transactionKindLabels[kind] : "Transaksi"} ${verb}`;
  }
  return `${auditEntityTypeLabel(entity, before, after)} ${verb}`;
}

/** Splits "Infaq Jumat · MSK-2026-0042" into name and reference. */
export function splitEntityLabel(label: string) {
  const index = label.lastIndexOf(" · ");
  if (index === -1) return { name: label, reference: null };
  return { name: label.slice(0, index), reference: label.slice(index + 3) };
}

const yesNo = (on: string, off: string) => (value: unknown) => (value ? on : off);
const text = (value: unknown) => String(value);
const kindText = (value: unknown) =>
  value === "income" || value === "expense" ? transactionKindLabels[value] : String(value);

type FieldSpec = { label: string; format: (value: unknown) => string; amount?: boolean };

/** Allowlisted, labelled fields per entity, in display order. */
export const fieldLabels: Record<AuditEntity, Record<string, FieldSpec>> = {
  transaction: {
    amount: { label: "Nominal", format: (value) => formatRupiah(Number(value)), amount: true },
    effectiveDate: { label: "Tanggal", format: (value) => formatLongDate(String(value)) },
    categoryName: { label: "Kategori", format: text },
    kind: { label: "Jenis", format: kindText },
    description: { label: "Keterangan", format: text },
    paymentMethod: { label: "Metode pembayaran", format: text },
    recipient: { label: "Penerima", format: text },
    proofFileName: { label: "Bukti transaksi", format: text },
  },
  category: {
    name: { label: "Nama kategori", format: text },
    code: { label: "Kode", format: text },
    kind: { label: "Jenis", format: kindText },
    note: { label: "Catatan", format: text },
    archived: { label: "Status", format: yesNo("Diarsipkan", "Aktif") },
  },
  user: {
    name: { label: "Nama", format: text },
    email: { label: "Email", format: text },
    role: {
      label: "Peran",
      format: (value) => roleLabels[value as keyof typeof roleLabels] ?? "Tanpa peran",
    },
    active: { label: "Status", format: yesNo("Aktif", "Nonaktif") },
  },
  mosque: {
    name: { label: "Nama masjid", format: text },
    address: { label: "Alamat", format: text },
    phone: { label: "Telepon", format: text },
    publicReportEnabled: { label: "Laporan publik", format: yesNo("Aktif", "Nonaktif") },
    loginBackgroundFileName: { label: "Latar halaman masuk", format: text },
  },
  report: {
    format: {
      label: "Format",
      format: (value) => (value === "xlsx" ? "Excel" : value === "pdf" ? "PDF" : String(value)),
    },
    from: { label: "Dari tanggal", format: (value) => formatLongDate(String(value)) },
    to: { label: "Sampai tanggal", format: (value) => formatLongDate(String(value)) },
    scope: { label: "Cakupan", format: text },
  },
};

export type FieldChange = {
  key: string;
  label: string;
  before: string | null;
  after: string | null;
  amount: boolean;
};

function formatField(spec: FieldSpec, value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return spec.format(value);
}

/**
 * Field-level view of one entry: changed fields for updates (and archive/restore), every
 * filled field for creates (after only) and deletes (before only).
 */
export function auditFieldChanges(
  entity: AuditEntity,
  action: AuditAction,
  before: Snapshot,
  after: Snapshot,
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const [key, spec] of Object.entries(fieldLabels[entity])) {
    const previous = before ? formatField(spec, before[key]) : null;
    const next = after ? formatField(spec, after[key]) : null;
    const amount = Boolean(spec.amount);
    if (action === "create" || !before) {
      if (next !== null)
        changes.push({ key, label: spec.label, before: null, after: next, amount });
    } else if (action === "delete" || !after) {
      if (previous !== null)
        changes.push({ key, label: spec.label, before: previous, after: null, amount });
    } else if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) {
      changes.push({ key, label: spec.label, before: previous, after: next, amount });
    }
  }
  return changes;
}
