import { auditLog } from "@keuangan-alkautsar/db/schema/finance";

import type { db } from "@/services";

/**
 * Field snapshots stored in `before`/`after`. Keys are shared with the S08 detail view,
 * which labels and diffs them, so every writer must use these shapes.
 */
export type AuditSnapshots = {
  transaction: {
    kind: "income" | "expense";
    categoryName: string;
    effectiveDate: string;
    amount: number;
    paymentMethod: string | null;
    recipient: string | null;
    description: string | null;
    proofFileName: string | null;
  };
  category: {
    kind: "income" | "expense";
    name: string;
    code: string;
    note: string | null;
    archived: boolean;
  };
  user: { name: string; email: string; role: string | null; active: boolean };
  mosque: {
    name: string;
    address: string | null;
    phone: string | null;
    publicReportEnabled: boolean;
    loginBackgroundFileName: string | null;
  };
  report: { format: "xlsx" | "pdf"; from: string; to: string; scope: string };
};

type AuditEntry = {
  [Entity in keyof AuditSnapshots]: Omit<
    typeof auditLog.$inferInsert,
    "id" | "createdAt" | "entity" | "before" | "after"
  > & {
    entity: Entity;
    before?: AuditSnapshots[Entity] | null;
    after?: AuditSnapshots[Entity] | null;
  };
}[keyof AuditSnapshots];

/** Executor accepted by `recordAudit`: the shared client or an open transaction. */
export type DbExecutor = Pick<typeof db, "insert">;

/**
 * Appends one change-history row (S08). Call it inside the same transaction as the change
 * so history and data never disagree. Never pass passwords, tokens, or file contents.
 */
export async function recordAudit(executor: DbExecutor, entry: AuditEntry) {
  await executor.insert(auditLog).values(entry);
}
