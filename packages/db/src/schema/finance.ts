import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  bytea,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const transactionKind = pgEnum("transaction_kind", ["income", "expense"]);

// Uploaded files (transaction proofs, login background) live in Postgres; each is at most 5 MB.
export const storedFile = pgTable("stored_file", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Single-tenant: the app serves one mosque, so its profile is a one-row table.
export const mosque = pgTable(
  "mosque",
  {
    id: integer("id").primaryKey().default(1),
    name: text("name").notNull(),
    address: text("address"),
    phone: text("phone"),
    loginBackgroundFileId: text("login_background_file_id").references(() => storedFile.id, {
      onDelete: "set null",
    }),
    publicReportEnabled: boolean("public_report_enabled").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [check("mosque_singleton", sql`${table.id} = 1`)],
);

export const category = pgTable(
  "category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    kind: transactionKind("kind").notNull(),
    name: text("name").notNull(),
    // Short human reference shown next to the name, e.g. "PM-001" or "PK-004".
    code: text("code").notNull(),
    note: text("note"),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Active names are unique per kind after case/whitespace normalization.
    uniqueIndex("category_active_name_idx")
      .on(table.kind, sql`lower(btrim(${table.name}))`)
      .where(sql`${table.archivedAt} is null`),
    uniqueIndex("category_code_idx").on(sql`upper(btrim(${table.code}))`),
  ],
);

export const ledgerTransaction = pgTable(
  "ledger_transaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Sequential reference number; displayed as MSK-<year>-<number> or KLR-<year>-<number>.
    number: integer("number").generatedAlwaysAsIdentity().notNull().unique(),
    kind: transactionKind("kind").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id),
    effectiveDate: date("effective_date", { mode: "string" }).notNull(),
    // Integer rupiah; never floating point.
    amount: bigint("amount", { mode: "number" }).notNull(),
    paymentMethod: text("payment_method"),
    recipient: text("recipient"),
    description: text("description"),
    proofFileId: text("proof_file_id").references(() => storedFile.id, { onDelete: "set null" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    check("ledger_transaction_amount_positive", sql`${table.amount} > 0`),
    index("ledger_transaction_date_idx").on(table.effectiveDate),
  ],
);

export const auditAction = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "archive",
  "restore",
]);

export const auditEntity = pgEnum("audit_entity", [
  "transaction",
  "category",
  "user",
  "mosque",
  "report",
]);

// Append-only change history (S08). Never store passwords, tokens, or file contents here.
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    action: auditAction("action").notNull(),
    entity: auditEntity("entity").notNull(),
    entityId: text("entity_id").notNull(),
    // Human reference at the time of the change, e.g. "Infaq Jumat · MSK-2026-1042".
    entityLabel: text("entity_label").notNull(),
    // Sentence shown in the list, e.g. "Mengubah transaksi pemasukan".
    summary: text("summary").notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_created_at_idx").on(table.createdAt),
    index("audit_log_entity_idx").on(table.entity, table.entityId),
  ],
);
