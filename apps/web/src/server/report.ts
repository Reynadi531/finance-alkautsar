import { category, ledgerTransaction } from "@keuangan-alkautsar/db/schema/finance";
import { and, asc, eq, gte, isNull, lt, lte, sql } from "drizzle-orm";

import type { ReportQuery } from "@/components/report/report-query";
import { transactionRef } from "@/lib/references";
import { getMosqueName } from "@/server/mosque";
import { db } from "@/services";

export type LedgerRow = {
  id: string;
  ref: string;
  kind: "income" | "expense";
  effectiveDate: string;
  /** Transaction description, or the category name when no description was recorded. */
  label: string;
  categoryName: string;
  amount: number;
  /** Cash balance right after this transaction, counting every transaction in ledger order. */
  balance: number;
};

export type CashReport = {
  mosqueName: string;
  query: ReportQuery;
  /** Cash balance at the end of the day before `from` (all transactions, all kinds). */
  openingBalance: number;
  /** Period totals over every transaction in the range, regardless of the kind filter. */
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
  /** `openingBalance + income − expense`. */
  closingBalance: number;
  /** Rows matching the kind filter, in ledger order (date, created time, number). */
  rows: LedgerRow[];
  /** Totals of `rows` only; equal to `income`/`expense` when the filter is "all". */
  shownIncome: number;
  shownExpense: number;
};

const live = isNull(ledgerTransaction.deletedAt);

/**
 * The single ledger computation behind S06: the on-screen report and both export formats call
 * this, so rows, order, running balances and totals are identical everywhere.
 *
 * Running balances always follow the full cash ledger. The kind filter only hides rows, so a
 * filtered report still shows true cash balances and the true closing balance.
 */
export async function buildCashReport(query: ReportQuery): Promise<CashReport> {
  const [mosqueName, [opening], periodRows] = await Promise.all([
    getMosqueName(),
    db
      .select({
        balance: sql<string>`coalesce(sum(case when ${ledgerTransaction.kind} = 'income' then ${ledgerTransaction.amount} else -${ledgerTransaction.amount} end), 0)`,
      })
      .from(ledgerTransaction)
      .where(and(live, lt(ledgerTransaction.effectiveDate, query.from))),
    db
      .select({
        id: ledgerTransaction.id,
        number: ledgerTransaction.number,
        kind: ledgerTransaction.kind,
        effectiveDate: ledgerTransaction.effectiveDate,
        amount: ledgerTransaction.amount,
        description: ledgerTransaction.description,
        categoryName: category.name,
      })
      .from(ledgerTransaction)
      .innerJoin(category, eq(category.id, ledgerTransaction.categoryId))
      .where(
        and(
          live,
          gte(ledgerTransaction.effectiveDate, query.from),
          lte(ledgerTransaction.effectiveDate, query.to),
        ),
      )
      // Deterministic order for same-day records.
      .orderBy(
        asc(ledgerTransaction.effectiveDate),
        asc(ledgerTransaction.createdAt),
        asc(ledgerTransaction.number),
      ),
  ]);

  const openingBalance = Number(opening.balance);
  let balance = openingBalance;
  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let shownIncome = 0;
  let shownExpense = 0;
  const rows: LedgerRow[] = [];

  for (const row of periodRows) {
    const amount = Number(row.amount);
    if (row.kind === "income") {
      balance += amount;
      income += amount;
      incomeCount += 1;
    } else {
      balance -= amount;
      expense += amount;
      expenseCount += 1;
    }
    if (query.kind !== "all" && row.kind !== query.kind) continue;
    if (row.kind === "income") shownIncome += amount;
    else shownExpense += amount;
    rows.push({
      id: row.id,
      ref: transactionRef(row.kind, row.number, row.effectiveDate),
      kind: row.kind,
      effectiveDate: row.effectiveDate,
      label: row.description?.trim() || row.categoryName,
      categoryName: row.categoryName,
      amount,
      balance,
    });
  }

  return {
    mosqueName,
    query,
    openingBalance,
    income,
    expense,
    incomeCount,
    expenseCount,
    closingBalance: openingBalance + income - expense,
    rows,
    shownIncome,
    shownExpense,
  };
}

/** Number of rows a report for `query` contains (export dialog footer). */
export async function countReportRows(query: ReportQuery) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ledgerTransaction)
    .where(
      and(
        live,
        gte(ledgerTransaction.effectiveDate, query.from),
        lte(ledgerTransaction.effectiveDate, query.to),
        query.kind === "all" ? undefined : eq(ledgerTransaction.kind, query.kind),
      ),
    );
  return row.count;
}

/** Ledger bounds for the month picker and the "Data diperbarui" stamp. */
export async function ledgerMeta() {
  const [row] = await db
    .select({
      firstDate: sql<
        string | null
      >`(min(${ledgerTransaction.effectiveDate}) filter (where ${ledgerTransaction.deletedAt} is null))::text`,
      lastDate: sql<
        string | null
      >`(max(${ledgerTransaction.effectiveDate}) filter (where ${ledgerTransaction.deletedAt} is null))::text`,
      // Deleting a transaction also changes the report, so it counts as an update.
      // Timestamps are stored in UTC without a zone.
      updatedAt: sql<
        string | null
      >`to_char(greatest(max(${ledgerTransaction.updatedAt}), max(${ledgerTransaction.deletedAt})), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
    })
    .from(ledgerTransaction);
  return {
    firstDate: row.firstDate,
    lastDate: row.lastDate,
    updatedAt: row.updatedAt,
  };
}
