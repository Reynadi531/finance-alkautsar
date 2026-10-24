import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const memberRole = pgEnum("member_role", ["admin", "treasurer", "viewer"]);
export const transactionKind = pgEnum("transaction_kind", ["income", "expense"]);

export const mosque = pgTable("mosque", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const mosqueMember = pgTable(
  "mosque_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    mosqueId: text("mosque_id")
      .notNull()
      .references(() => mosque.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("mosque_member_mosque_user_idx").on(table.mosqueId, table.userId),
    index("mosque_member_user_idx").on(table.userId),
  ],
);

export const category = pgTable(
  "category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    mosqueId: text("mosque_id")
      .notNull()
      .references(() => mosque.id, { onDelete: "cascade" }),
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
    // Active names are unique per mosque and kind after case/whitespace normalization.
    uniqueIndex("category_active_name_idx")
      .on(table.mosqueId, table.kind, sql`lower(btrim(${table.name}))`)
      .where(sql`${table.archivedAt} is null`),
  ],
);

export const ledgerTransaction = pgTable(
  "ledger_transaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    mosqueId: text("mosque_id")
      .notNull()
      .references(() => mosque.id, { onDelete: "cascade" }),
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
    index("ledger_transaction_mosque_date_idx").on(table.mosqueId, table.effectiveDate),
  ],
);
