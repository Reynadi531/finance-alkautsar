import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { reportQuerySchema } from "@/components/report/report-query";
import { authMiddleware } from "@/middleware/auth";
import { financeStaff, requireRole } from "@/server/authz";
import { buildCashReport, countReportRows, ledgerMeta } from "@/server/report";

/** Ledger rows per page on the S06 screen (opening/carried balance rows come on top). */
export const LEDGER_PAGE_SIZE = 8;

export type CashReportPage = Awaited<ReturnType<typeof getCashReport>>;

/** S06 screen data: full-period computation, then one page of rows with balances intact. */
export const getCashReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(reportQuerySchema.and(z.object({ page: z.number().int().min(1).default(1) })))
  .handler(async ({ context, data }) => {
    requireRole(context.session, financeStaff);
    const { page: requestedPage, ...query } = data;
    const [report, meta] = await Promise.all([buildCashReport(query), ledgerMeta()]);

    const total = report.rows.length;
    const pageCount = Math.max(1, Math.ceil(total / LEDGER_PAGE_SIZE));
    const page = Math.min(requestedPage, pageCount);
    const start = (page - 1) * LEDGER_PAGE_SIZE;
    const rows = report.rows.slice(start, start + LEDGER_PAGE_SIZE);
    // Balance carried onto this page: the running balance after the last row of the previous page.
    const carriedBalance = start === 0 ? report.openingBalance : report.rows[start - 1].balance;

    return {
      mosqueName: report.mosqueName,
      query: report.query,
      openingBalance: report.openingBalance,
      income: report.income,
      expense: report.expense,
      incomeCount: report.incomeCount,
      expenseCount: report.expenseCount,
      closingBalance: report.closingBalance,
      shownIncome: report.shownIncome,
      shownExpense: report.shownExpense,
      total,
      page,
      pageSize: LEDGER_PAGE_SIZE,
      rows,
      carriedBalance,
      meta,
    };
  });

/** Row count for the export dialog footer when its period or scope differs from the screen. */
export const getReportRowCount = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(reportQuerySchema)
  .handler(async ({ context, data }) => {
    requireRole(context.session, financeStaff);
    return countReportRows(data);
  });
