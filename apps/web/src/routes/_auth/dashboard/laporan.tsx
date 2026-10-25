import { Skeleton } from "@keuangan-alkautsar/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { FileDown } from "lucide-react";
import { useState } from "react";
import z from "zod";

import { ActionButton } from "@/components/action-button";
import { InfoNote } from "@/components/info-note";
import { PageContainer, PageError } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { ExportDialog, type ExportedReport } from "@/components/report/export-dialog";
import { ExportSuccessDialog } from "@/components/report/export-success-dialog";
import { LedgerTable } from "@/components/report/ledger-table";
import {
  CustomRangeFilter,
  KindFilter,
  MonthFilter,
  UpdatedStamp,
} from "@/components/report/report-filters";
import {
  invalidRangeMessage,
  reportKinds,
  type ReportKind,
} from "@/components/report/report-query";
import { ReportSummary } from "@/components/report/report-summary";
import { getCashReport } from "@/functions/report";
import { currentMonthRange, isoDateSchema, type DateRange } from "@/lib/date-range";
import { pageParam } from "@/lib/pagination";

const searchSchema = z.object({
  from: isoDateSchema.optional().catch(undefined),
  to: isoDateSchema.optional().catch(undefined),
  kind: z.enum(reportKinds).optional().catch(undefined),
  page: pageParam,
});

type ReportSearch = z.infer<typeof searchSchema>;

/** A range from the URL, or the current month; a reversed range is rejected (flagged). */
function resolveRange(search: ReportSearch): DateRange & { rejected: boolean } {
  if (search.from && search.to) {
    if (search.from <= search.to) return { from: search.from, to: search.to, rejected: false };
    return { ...currentMonthRange(), rejected: true };
  }
  return { ...currentMonthRange(), rejected: false };
}

export const Route = createFileRoute("/_auth/dashboard/laporan")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => {
    const { rejected: _rejected, ...range } = resolveRange(search);
    return { ...range, kind: search.kind ?? ("all" as ReportKind), page: search.page ?? 1 };
  },
  loader: ({ deps }) => getCashReport({ data: deps }),
  head: () => ({ meta: [{ title: "Laporan kas · ruangmasjid" }] }),
  component: CashReportPage,
  pendingComponent: CashReportSkeleton,
  errorComponent: () => (
    <PageError
      title="Laporan kas gagal dimuat"
      message="Data laporan tidak dapat diambil. Periksa koneksi Anda, lalu coba lagi."
    />
  ),
});

function CashReportPage() {
  const report = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [exportOpen, setExportOpen] = useState(false);
  const [exported, setExported] = useState<ExportedReport | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const rejected = resolveRange(search).rejected;
  const { query } = report;

  const setRange = ({ from, to }: DateRange) =>
    navigate({ search: (prev) => ({ ...prev, from, to, page: undefined }) });

  return (
    <PageContainer>
      <PageHeader
        title="Laporan kas"
        description="Pantau arus dana dan unduh laporan keuangan masjid."
        action={
          <ActionButton onClick={() => setExportOpen(true)} className="px-[15px]">
            <FileDown aria-hidden />
            Ekspor laporan
          </ActionButton>
        }
      />

      <div className="-mt-1 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter laporan"
            className="flex flex-wrap items-center gap-2.5"
          >
            <MonthFilter range={query} bounds={report.meta} onChange={setRange} />
            <CustomRangeFilter range={query} onChange={setRange} />
            <KindFilter
              value={query.kind}
              onChange={(kind) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    kind: kind === "all" ? undefined : kind,
                    page: undefined,
                  }),
                })
              }
            />
          </div>
          <UpdatedStamp updatedAt={report.meta.updatedAt} />
        </div>
        {rejected ? (
          <p
            role="alert"
            className="rounded-lg bg-expense-surface px-4 py-3 text-[13px] text-expense"
          >
            Rentang tanggal di tautan ditolak: {invalidRangeMessage.toLowerCase()} Laporan
            menampilkan bulan ini.
          </p>
        ) : null}
      </div>

      <ReportSummary
        from={query.from}
        openingBalance={report.openingBalance}
        income={report.income}
        expense={report.expense}
        incomeCount={report.incomeCount}
        expenseCount={report.expenseCount}
        closingBalance={report.closingBalance}
      />

      <LedgerTable
        kind={query.kind}
        from={query.from}
        to={query.to}
        rows={report.rows}
        total={report.total}
        page={report.page}
        pageSize={report.pageSize}
        openingBalance={report.openingBalance}
        carriedBalance={report.carriedBalance}
        closingBalance={report.closingBalance}
        shownIncome={report.shownIncome}
        shownExpense={report.shownExpense}
        onPageChange={(page) =>
          navigate({ search: (prev) => ({ ...prev, page: page === 1 ? undefined : page }) })
        }
      />

      <InfoNote className="items-center gap-3 px-[18px] py-3.5 text-xs [&>svg]:size-[18px]">
        Saldo akhir dihitung dari saldo awal ditambah pemasukan, dikurangi pengeluaran. Laporan ini
        hanya mencakup transaksi yang tercatat.
      </InfoNote>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        mosqueName={report.mosqueName}
        initialQuery={query}
        initialCount={report.total}
        onExported={(file) => {
          setExported(file);
          setExportOpen(false);
          setSuccessOpen(true);
        }}
      />
      <ExportSuccessDialog
        open={successOpen}
        report={exported}
        mosqueName={report.mosqueName}
        onClose={() => setSuccessOpen(false)}
      />
    </PageContainer>
  );
}

function CashReportSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-label="Memuat laporan kas">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-48 rounded-lg bg-white" />
        <Skeleton className="h-[38px] w-36 rounded-lg bg-white" />
      </div>
      <Skeleton className="h-5 w-80 max-w-full rounded-lg bg-white" />
      <div className="flex gap-2.5">
        <Skeleton className="h-[38px] w-32 rounded-lg bg-white" />
        <Skeleton className="h-[38px] w-36 rounded-lg bg-white" />
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[118px] rounded-xl bg-white" />
        ))}
      </div>
      <Skeleton className="h-[472px] rounded-xl bg-white" />
    </PageContainer>
  );
}
