import { category, ledgerTransaction, storedFile } from "@keuangan-alkautsar/db/schema/finance";
import { and, asc, desc, eq, gte, ilike, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import type z from "zod";

import { parseCsv } from "@/components/transactions/csv";
import {
  MAX_AMOUNT,
  TRANSACTION_PAGE_SIZE,
  saveFieldsSchema,
  type importInputSchema,
  type transactionPageInputSchema,
  kindCopy,
  monthOf,
  monthRange,
  parseAmount,
  paymentMethods,
  shiftMonth,
  type MonthParam,
  type TransactionKind,
} from "@/components/transactions/model";
import { todayIso } from "@/lib/date-range";
import { pageOffset } from "@/lib/pagination";
import { transactionRef } from "@/lib/references";
import { recordAudit, type AuditSnapshots } from "@/server/audit";
import type { requireRole } from "@/server/authz";
import {
  assertUpload,
  deleteStoredFile,
  proofMimeTypes,
  removeObjects,
  saveUpload,
} from "@/server/files";
import { db } from "@/services";

/**
 * Server-only data access for S02/S03 and the CSV routes. Never import this from client
 * code; `functions/transactions.ts` wraps these in server functions.
 */

type StaffUser = ReturnType<typeof requireRole>;

const live = isNull(ledgerTransaction.deletedAt);

// Same shape as `transactionRef` so references are searchable ("MSK-2026-0042").
const refSql = sql<string>`concat(case when ${ledgerTransaction.kind} = 'income' then 'MSK' else 'KLR' end, '-', to_char(${ledgerTransaction.effectiveDate}, 'YYYY'), '-', case when ${ledgerTransaction.number} < 1000 then lpad(${ledgerTransaction.number}::text, 4, '0') else ${ledgerTransaction.number}::text end)`;

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Filters for the list and the CSV export: kind, month (unless "all") and free-text search. */
export function transactionFilters(kind: TransactionKind, month: MonthParam, q: string) {
  const conditions: SQL[] = [live, eq(ledgerTransaction.kind, kind)];
  if (month !== "all") {
    const range = monthRange(month);
    conditions.push(
      gte(ledgerTransaction.effectiveDate, range.from),
      lte(ledgerTransaction.effectiveDate, range.to),
    );
  }
  const term = q.trim();
  if (term) {
    const pattern = `%${escapeLike(term)}%`;
    conditions.push(
      or(
        ilike(ledgerTransaction.description, pattern),
        ilike(category.name, pattern),
        ilike(category.code, pattern),
        ilike(ledgerTransaction.paymentMethod, pattern),
        ilike(ledgerTransaction.recipient, pattern),
        sql`${refSql} ilike ${pattern}`,
      )!,
    );
  }
  return and(...conditions)!;
}

const rowColumns = {
  id: ledgerTransaction.id,
  number: ledgerTransaction.number,
  kind: ledgerTransaction.kind,
  effectiveDate: ledgerTransaction.effectiveDate,
  amount: ledgerTransaction.amount,
  paymentMethod: ledgerTransaction.paymentMethod,
  recipient: ledgerTransaction.recipient,
  description: ledgerTransaction.description,
  createdAt: ledgerTransaction.createdAt,
  categoryId: category.id,
  categoryName: category.name,
  categoryCode: category.code,
  categoryArchived: sql<boolean>`${category.archivedAt} is not null`,
  proofFileId: storedFile.id,
  proofFileName: storedFile.fileName,
  proofMimeType: storedFile.mimeType,
};

/** Matching transactions, newest first. `limit`/`offset` omitted means all rows (export). */
export function selectTransactions(where: SQL, page?: { limit: number; offset: number }) {
  const query = db
    .select(rowColumns)
    .from(ledgerTransaction)
    .innerJoin(category, eq(category.id, ledgerTransaction.categoryId))
    .leftJoin(storedFile, eq(storedFile.id, ledgerTransaction.proofFileId))
    .where(where)
    .orderBy(desc(ledgerTransaction.effectiveDate), desc(ledgerTransaction.number));
  return page ? query.limit(page.limit).offset(page.offset) : query;
}

export type TransactionRow = Awaited<ReturnType<typeof selectTransactions>>[number] & {
  ref: string;
};

export function withRef<
  Row extends { kind: TransactionKind; number: number; effectiveDate: string },
>(row: Row) {
  return { ...row, ref: transactionRef(row.kind, row.number, row.effectiveDate) };
}

async function monthTotals(kind: TransactionKind, month: MonthParam) {
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${ledgerTransaction.amount}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(ledgerTransaction)
    .innerJoin(category, eq(category.id, ledgerTransaction.categoryId))
    .where(transactionFilters(kind, month, ""));
  return { total: Number(row.total), count: row.count };
}

export type TransactionPageData = Awaited<ReturnType<typeof loadTransactionPage>>;

/** Everything S02/S03 render: summaries for the month, top category, one page of rows. */
export async function loadTransactionPage(
  user: StaffUser,
  { kind, month, q, page }: z.infer<typeof transactionPageInputSchema>,
) {
  const where = transactionFilters(kind, month, q);
  const previousMonth = month === "all" ? null : shiftMonth(month, -1);

  const [current, previous, top, rows, [{ total: matching }], monthRows, categories] =
    await Promise.all([
      monthTotals(kind, month),
      previousMonth ? monthTotals(kind, previousMonth) : null,
      db
        .select({
          name: category.name,
          amount: sql<string>`sum(${ledgerTransaction.amount})`,
        })
        .from(ledgerTransaction)
        .innerJoin(category, eq(category.id, ledgerTransaction.categoryId))
        .where(transactionFilters(kind, month, ""))
        .groupBy(category.id, category.name)
        .orderBy(desc(sql`2`), asc(category.name))
        .limit(1),
      selectTransactions(where, {
        limit: TRANSACTION_PAGE_SIZE,
        offset: pageOffset(page, TRANSACTION_PAGE_SIZE),
      }),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(ledgerTransaction)
        .innerJoin(category, eq(category.id, ledgerTransaction.categoryId))
        .where(where),
      db
        .selectDistinct({
          month: sql<string>`to_char(${ledgerTransaction.effectiveDate}, 'YYYY-MM')`,
        })
        .from(ledgerTransaction)
        .where(and(live, eq(ledgerTransaction.kind, kind))),
      db
        .select({ id: category.id, name: category.name, code: category.code })
        .from(category)
        .where(and(eq(category.kind, kind), isNull(category.archivedAt)))
        .orderBy(asc(category.name)),
    ]);

  const thisMonth = monthOf(todayIso());
  const months = [...new Set([thisMonth, ...monthRows.map((row) => row.month)])].sort().reverse();
  const topCategory = top[0]
    ? {
        name: top[0].name,
        amount: Number(top[0].amount),
        share: current.total > 0 ? Number(top[0].amount) / current.total : 0,
      }
    : null;

  return {
    kind,
    role: user.role,
    month,
    previousMonth,
    q,
    page,
    summary: { current, previous },
    topCategory,
    rows: rows.map(withRef),
    total: matching,
    months,
    categories,
  };
}

// --- Mutations ----------------------------------------------------------------------

export type FieldErrors = Partial<
  Record<
    | "effectiveDate"
    | "categoryId"
    | "amount"
    | "paymentMethod"
    | "recipient"
    | "description"
    | "proof",
    string
  >
>;
export type SaveResult = { ok: true; ref: string } | { ok: false; fieldErrors: FieldErrors };

function formText(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value : undefined;
}

function snapshot(
  row: {
    kind: TransactionKind;
    effectiveDate: string;
    amount: number;
    paymentMethod: string | null;
    recipient: string | null;
    description: string | null;
  },
  categoryName: string,
  proofFileName: string | null,
): AuditSnapshots["transaction"] {
  return {
    kind: row.kind,
    categoryName,
    effectiveDate: row.effectiveDate,
    amount: row.amount,
    paymentMethod: row.paymentMethod,
    recipient: row.recipient,
    description: row.description,
    proofFileName,
  };
}

async function findTransaction(executor: typeof db, id: string) {
  const [row] = await executor
    .select(rowColumns)
    .from(ledgerTransaction)
    .innerJoin(category, eq(category.id, ledgerTransaction.categoryId))
    .leftJoin(storedFile, eq(storedFile.id, ledgerTransaction.proofFileId))
    .where(and(eq(ledgerTransaction.id, id), live));
  return row;
}

/** Creates (no `id`) or updates a transaction from the S02/S03 form, with optional proof file. */
export async function saveTransactionForm(user: StaffUser, data: FormData): Promise<SaveResult> {
  const parsed = saveFieldsSchema.safeParse({
    id: formText(data, "id") || undefined,
    kind: formText(data, "kind"),
    effectiveDate: formText(data, "effectiveDate"),
    categoryId: formText(data, "categoryId") ?? "",
    amount: formText(data, "amount") ?? "",
    paymentMethod: formText(data, "paymentMethod") ?? "",
    recipient: formText(data, "recipient") ?? "",
    description: formText(data, "description") ?? "",
    removeProof: formText(data, "removeProof") ?? "0",
  });
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof FieldErrors;
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const fields = parsed.data;
  const proof = data.get("proof");
  const upload = proof instanceof File && proof.size > 0 ? proof : null;
  if (upload) {
    try {
      assertUpload(upload, proofMimeTypes);
    } catch (error) {
      return { ok: false, fieldErrors: { proof: (error as Error).message } };
    }
  }

  const existing = fields.id ? await findTransaction(db, fields.id) : undefined;
  if (fields.id && (!existing || existing.kind !== fields.kind)) {
    throw new Error("Transaksi tidak ditemukan atau sudah dihapus.");
  }

  const [chosenCategory] = await db
    .select({
      id: category.id,
      name: category.name,
      kind: category.kind,
      archivedAt: category.archivedAt,
    })
    .from(category)
    .where(eq(category.id, fields.categoryId));
  const categoryAllowed =
    chosenCategory &&
    chosenCategory.kind === fields.kind &&
    (!chosenCategory.archivedAt || chosenCategory.id === existing?.categoryId);
  if (!categoryAllowed) {
    return { ok: false, fieldErrors: { categoryId: "Pilih tipe yang masih aktif." } };
  }

  const values = {
    kind: fields.kind,
    categoryId: chosenCategory.id,
    effectiveDate: fields.effectiveDate,
    amount: parseAmount(fields.amount)!,
    paymentMethod: fields.paymentMethod || null,
    recipient: fields.kind === "expense" ? fields.recipient || null : (existing?.recipient ?? null),
    description: fields.description || null,
  };
  const noun = kindCopy[fields.kind].noun;

  // Object keys to remove once the transaction commits (replaced proof) or rolls back (new proof).
  let replacedKey: string | undefined;
  let uploadedKey: string | undefined;
  const result = await db
    .transaction(async (tx) => {
      let proofFileId = existing?.proofFileId ?? null;
      let proofFileName = existing?.proofFileName ?? null;
      const replacesProof = Boolean(upload) || fields.removeProof === "1";
      if (replacesProof && existing?.proofFileId) {
        replacedKey = await deleteStoredFile(tx, existing.proofFileId);
        proofFileId = null;
        proofFileName = null;
      }
      if (upload) {
        const saved = await saveUpload(tx, upload);
        uploadedKey = saved.key;
        proofFileId = saved.id;
        proofFileName = upload.name;
      }

      const after = snapshot(values, chosenCategory.name, proofFileName);

      if (existing) {
        await tx
          .update(ledgerTransaction)
          .set({ ...values, proofFileId })
          .where(eq(ledgerTransaction.id, existing.id));
        const ref = transactionRef(fields.kind, existing.number, values.effectiveDate);
        await recordAudit(tx, {
          actorId: user.id,
          action: "update",
          entity: "transaction",
          entityId: existing.id,
          entityLabel: `${chosenCategory.name} · ${ref}`,
          summary: `Mengubah transaksi ${noun}`,
          before: snapshot(existing, existing.categoryName, existing.proofFileName),
          after,
        });
        return { ok: true as const, ref };
      }

      const [created] = await tx
        .insert(ledgerTransaction)
        .values({ ...values, proofFileId, createdBy: user.id })
        .returning({ id: ledgerTransaction.id, number: ledgerTransaction.number });
      const ref = transactionRef(fields.kind, created.number, values.effectiveDate);
      await recordAudit(tx, {
        actorId: user.id,
        action: "create",
        entity: "transaction",
        entityId: created.id,
        entityLabel: `${chosenCategory.name} · ${ref}`,
        summary: `Menambahkan transaksi ${noun}`,
        after,
      });
      return { ok: true as const, ref };
    })
    .catch(async (error: unknown) => {
      await removeObjects(uploadedKey);
      throw error;
    });
  await removeObjects(replacedKey);
  return result;
}

/** Soft-deletes a transaction (sets `deletedAt`) and records it in the change log. */
export async function softDeleteTransaction(user: StaffUser, data: { id: string }) {
  const existing = await findTransaction(db, data.id);
  if (!existing) {
    throw new Error("Transaksi tidak ditemukan atau sudah dihapus.");
  }
  const ref = transactionRef(existing.kind, existing.number, existing.effectiveDate);
  await db.transaction(async (tx) => {
    await tx
      .update(ledgerTransaction)
      .set({ deletedAt: new Date() })
      .where(eq(ledgerTransaction.id, existing.id));
    await recordAudit(tx, {
      actorId: user.id,
      action: "delete",
      entity: "transaction",
      entityId: existing.id,
      entityLabel: `${existing.categoryName} · ${ref}`,
      summary: `Menghapus transaksi ${kindCopy[existing.kind].noun}`,
      before: snapshot(existing, existing.categoryName, existing.proofFileName),
    });
  });
  return { ref };
}

// --- CSV import ---------------------------------------------------------------------

const MAX_IMPORT_ROWS = 1000;

export type ImportResult =
  | { ok: true; count: number }
  | { ok: false; errors: { line: number; message: string }[] };

const headerAliases: Record<string, string> = {
  tanggal: "date",
  kode_tipe: "type",
  tipe: "type",
  nama_tipe: "type",
  kategori: "type",
  jumlah: "amount",
  "jumlah_(rp)": "amount",
  metode: "method",
  metode_pembayaran: "method",
  penerima: "recipient",
  keterangan: "description",
};

function normalizeHeader(cell: string) {
  return cell
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/** Accepts "2026-10-31" or "31/10/2026" (also "31-10-2026"); returns ISO or null. */
function parseImportDate(value: string) {
  const trimmed = value.trim();
  let year: number, month: number, day: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
  if (iso) [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (local) [day, month, year] = [Number(local[1]), Number(local[2]), Number(local[3])];
  else return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Imports a CSV of one kind. Every row is validated first; nothing is saved unless all rows
 * are valid. Each created transaction gets its own change-log entry (note "Impor CSV").
 */
export async function importTransactionCsv(
  user: StaffUser,
  data: z.infer<typeof importInputSchema>,
): Promise<ImportResult> {
  const rows = parseCsv(data.text);
  const fail = (line: number, message: string): ImportResult => ({
    ok: false,
    errors: [{ line, message }],
  });
  if (rows.length === 0) return fail(1, "Berkas kosong.");

  const columns = rows[0].map((cell) => headerAliases[normalizeHeader(cell)]);
  const columnIndex = (name: string) => columns.indexOf(name);
  for (const [required, label] of [
    ["date", "tanggal"],
    ["type", "kode_tipe atau tipe"],
    ["amount", "jumlah"],
  ] as const) {
    if (columnIndex(required) === -1)
      return fail(1, `Kolom ${label} tidak ditemukan di baris judul.`);
  }

  const body = rows
    .map((cells, index) => ({ cells, line: index + 1 }))
    .slice(1)
    .filter(({ cells }) => cells.some((cell) => cell.trim() !== ""));
  if (body.length === 0) return fail(2, "Tidak ada baris data.");
  if (body.length > MAX_IMPORT_ROWS) {
    return fail(1, `Maksimal ${MAX_IMPORT_ROWS} baris per impor.`);
  }

  const categories = await db
    .select({ id: category.id, name: category.name, code: category.code })
    .from(category)
    .where(and(eq(category.kind, data.kind), isNull(category.archivedAt)));
  const byCode = new Map(categories.map((row) => [row.code.trim().toUpperCase(), row]));
  const byName = new Map(categories.map((row) => [normalizeName(row.name), row]));

  const errors: { line: number; message: string }[] = [];
  const parsedRows: {
    values: typeof ledgerTransaction.$inferInsert;
    categoryName: string;
  }[] = [];

  for (const { cells, line } of body) {
    const cell = (name: string) => {
      const index = columnIndex(name);
      return index === -1 ? "" : (cells[index] ?? "").trim();
    };
    const problems: string[] = [];

    const effectiveDate = parseImportDate(cell("date"));
    if (!effectiveDate) problems.push("tanggal harus YYYY-MM-DD atau DD/MM/YYYY");

    const typeValue = cell("type");
    const matched = byCode.get(typeValue.toUpperCase()) ?? byName.get(normalizeName(typeValue));
    if (!typeValue) problems.push("tipe wajib diisi");
    else if (!matched) problems.push(`tipe "${typeValue}" tidak ditemukan atau sudah diarsipkan`);

    const amount = parseAmount(cell("amount"));
    if (amount === null || amount <= 0 || amount > MAX_AMOUNT) {
      problems.push("jumlah harus bilangan bulat lebih dari 0");
    }

    const methodInput = cell("method");
    const method = paymentMethods.find(
      (option) => option.toLowerCase() === methodInput.toLowerCase(),
    );
    if (methodInput && !method) problems.push(`metode harus ${paymentMethods.join(", ")}`);

    const recipient = data.kind === "expense" ? cell("recipient") : "";
    const description = cell("description");
    if (recipient.length > 120) problems.push("penerima maksimal 120 karakter");
    if (description.length > 500) problems.push("keterangan maksimal 500 karakter");

    if (problems.length > 0) {
      errors.push({ line, message: problems.join("; ") });
      continue;
    }
    parsedRows.push({
      categoryName: matched!.name,
      values: {
        kind: data.kind,
        categoryId: matched!.id,
        effectiveDate: effectiveDate!,
        amount: amount!,
        paymentMethod: method ?? null,
        recipient: recipient || null,
        description: description || null,
        createdBy: user.id,
      },
    });
  }

  if (errors.length > 0) return { ok: false, errors };

  const noun = kindCopy[data.kind].noun;
  await db.transaction(async (tx) => {
    // One insert per row keeps each reference paired with its own audit entry.
    for (const source of parsedRows) {
      const [row] = await tx
        .insert(ledgerTransaction)
        .values(source.values)
        .returning({ id: ledgerTransaction.id, number: ledgerTransaction.number });
      const ref = transactionRef(data.kind, row.number, source.values.effectiveDate);
      await recordAudit(tx, {
        actorId: user.id,
        action: "create",
        entity: "transaction",
        entityId: row.id,
        entityLabel: `${source.categoryName} · ${ref}`,
        summary: `Menambahkan transaksi ${noun}`,
        note: `Impor CSV: ${data.fileName}`,
        after: snapshot(
          {
            kind: data.kind,
            effectiveDate: source.values.effectiveDate,
            amount: source.values.amount,
            paymentMethod: source.values.paymentMethod ?? null,
            recipient: source.values.recipient ?? null,
            description: source.values.description ?? null,
          },
          source.categoryName,
          null,
        ),
      });
    }
  });
  return { ok: true, count: parsedRows.length };
}
