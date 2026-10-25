import { category, ledgerTransaction } from "@keuangan-alkautsar/db/schema/finance";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import z from "zod";

import { isoDateSchema, previousRange, startOfMonth, type DateRange } from "@/lib/date-range";
import { authMiddleware } from "@/middleware/auth";
import { getMosqueName } from "@/server/mosque";
import { db } from "@/services";

const TREND_MONTHS = 5;
const RECENT_LIMIT = 5;

const rangeSchema = z
  .object({ from: isoDateSchema, to: isoDateSchema })
  .refine((range) => range.from <= range.to, "Tanggal akhir harus setelah tanggal mulai.");

const signedAmount = sql<string>`coalesce(sum(case when ${ledgerTransaction.kind} = 'income' then ${ledgerTransaction.amount} else -${ledgerTransaction.amount} end), 0)`;

const liveTransactions = isNull(ledgerTransaction.deletedAt);

async function periodTotals({ from, to }: DateRange) {
  const [row] = await db
    .select({
      income: sql<string>`coalesce(sum(${ledgerTransaction.amount}) filter (where ${ledgerTransaction.kind} = 'income'), 0)`,
      expense: sql<string>`coalesce(sum(${ledgerTransaction.amount}) filter (where ${ledgerTransaction.kind} = 'expense'), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(ledgerTransaction)
    .where(
      and(
        liveTransactions,
        gte(ledgerTransaction.effectiveDate, from),
        lte(ledgerTransaction.effectiveDate, to),
      ),
    );
  return { income: Number(row.income), expense: Number(row.expense), count: row.count };
}

export type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;

export const getDashboardOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(rangeSchema)
  .handler(async ({ context, data: range }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const role = context.session.user.role;
    if (!role) {
      return null;
    }
    const trendFrom = startOfMonth(range.to, -(TREND_MONTHS - 1));
    const comparisonRange = previousRange(range);

    const [mosqueName, current, previous, closing, monthlyRows, recent] = await Promise.all([
      getMosqueName(),
      periodTotals(range),
      periodTotals(comparisonRange),
      db
        .select({ balance: signedAmount })
        .from(ledgerTransaction)
        .where(and(liveTransactions, lte(ledgerTransaction.effectiveDate, range.to))),
      db
        .select({
          month: sql<string>`to_char(date_trunc('month', ${ledgerTransaction.effectiveDate}), 'YYYY-MM-DD')`,
          income: sql<string>`coalesce(sum(${ledgerTransaction.amount}) filter (where ${ledgerTransaction.kind} = 'income'), 0)`,
          expense: sql<string>`coalesce(sum(${ledgerTransaction.amount}) filter (where ${ledgerTransaction.kind} = 'expense'), 0)`,
        })
        .from(ledgerTransaction)
        .where(
          and(
            liveTransactions,
            gte(ledgerTransaction.effectiveDate, trendFrom),
            lte(ledgerTransaction.effectiveDate, range.to),
          ),
        )
        .groupBy(sql`1`),
      db
        .select({
          id: ledgerTransaction.id,
          kind: ledgerTransaction.kind,
          effectiveDate: ledgerTransaction.effectiveDate,
          amount: ledgerTransaction.amount,
          description: ledgerTransaction.description,
          categoryName: category.name,
        })
        .from(ledgerTransaction)
        .innerJoin(category, eq(category.id, ledgerTransaction.categoryId))
        .where(and(liveTransactions, lte(ledgerTransaction.effectiveDate, range.to)))
        .orderBy(desc(ledgerTransaction.effectiveDate), desc(ledgerTransaction.createdAt))
        .limit(RECENT_LIMIT),
    ]);

    const monthly = Array.from({ length: TREND_MONTHS }, (_, index) => {
      const month = startOfMonth(range.to, index - (TREND_MONTHS - 1));
      const row = monthlyRows.find((candidate) => candidate.month === month);
      return {
        month,
        income: Number(row?.income ?? 0),
        expense: Number(row?.expense ?? 0),
      };
    });

    return {
      mosqueName,
      role,
      range,
      comparisonRange,
      current,
      previous,
      closingBalance: Number(closing[0].balance),
      monthly,
      recent,
    };
  });
