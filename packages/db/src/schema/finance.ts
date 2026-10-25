import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const transactionKind = pgEnum("transaction_kind", ["income", "expense"]);

// Single-tenant: the app serves one mosque, so its profile is a one-row table.
export const mosque = pgTable(
  "mosque",
  {
    id: integer("id").primaryKey().default(1),
    name: text("name").notNull(),
    address: text("address"),
    phone: text("phone"),
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
  ],
);

export const ledgerTransaction = pgTable(
  "ledger_transaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
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
