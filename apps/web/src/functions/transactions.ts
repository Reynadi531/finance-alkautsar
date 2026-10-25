import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { importInputSchema, transactionPageInputSchema } from "@/components/transactions/model";
import { authMiddleware } from "@/middleware/auth";
import { financeStaff, requireRole } from "@/server/authz";
import {
  importTransactionCsv,
  loadTransactionPage,
  saveTransactionForm,
  softDeleteTransaction,
} from "@/server/transactions";

// Thin server-function wrappers; the db work lives in server/transactions.ts so none of it
// reaches the client bundle.

export type {
  FieldErrors,
  ImportResult,
  SaveResult,
  TransactionPageData,
} from "@/server/transactions";

/** Everything S02/S03 render: summaries for the month, top category, one page of rows. */
export const getTransactionPage = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(transactionPageInputSchema)
  .handler(({ context, data }) =>
    loadTransactionPage(requireRole(context.session, financeStaff), data),
  );

/** Creates (no `id`) or updates a transaction from the S02/S03 form, with optional proof file. */
export const saveTransaction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error("Data formulir tidak valid.");
    return data;
  })
  .handler(({ context, data }) =>
    saveTransactionForm(requireRole(context.session, financeStaff), data),
  );

/** Soft-deletes a transaction (sets `deletedAt`) and records it in the change log. */
export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(({ context, data }) =>
    softDeleteTransaction(requireRole(context.session, financeStaff), data),
  );

/** Imports a CSV of one kind; all rows are saved or none are. */
export const importTransactions = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(importInputSchema)
  .handler(({ context, data }) =>
    importTransactionCsv(requireRole(context.session, financeStaff), data),
  );
