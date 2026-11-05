import { Skeleton } from "@keuangan-alkautsar/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { DateRangePicker } from "@/components/date-range-picker";
import { InfoNote } from "@/components/info-note";
import { PageContainer, PageError } from "@/components/page-layout";
import { getDashboardOverview } from "@/functions/dashboard";
import { currentMonthRange, isFullMonth, isoDateSchema, type DateRange } from "@/lib/date-range";

const searchSchema = z.object({
  from: isoDateSchema.optional().catch(undefined),
  to: isoDateSchema.optional().catch(undefined),
});

function resolveRange(search: z.infer<typeof searchSchema>): DateRange {
  if (search.from && search.to && search.from <= search.to) {
    return { from: search.from, to: search.to };
  }
  return currentMonthRange();
}

export const Route = createFileRoute("/_auth/dashboard/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => resolveRange(search),
  loader: ({ deps }) => getDashboardOverview({ data: deps }),
  head: () => ({ meta: [{ title: "Dashboard · ruangmasjid" }] }),
  component: DashboardPage,
  pendingComponent: DashboardSkeleton,
  errorComponent: DashboardError,
});

function firstName(name: string) {
  return name.split(/\s+/)[0] ?? name;
}

function DashboardPage() {
  const overview = Route.useLoaderData();
  const { shell } = Route.useRouteContext();
  const navigate = Route.useNavigate();

  if (!overview) {
    return null;
  }

  const thisMonth = currentMonthRange();
  const isThisMonth = overview.range.from === thisMonth.from && overview.range.to === thisMonth.to;

  return (
    <PageContainer className="gap-5 px-5 pt-7 pb-8 sm:px-6 lg:gap-[22px] lg:p-8">
      <header className="grid grid-cols-1 items-center gap-x-4 gap-y-3.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-y-3">
        <h1 className="font-display text-[25px] font-semibold tracking-[-0.8px] text-ink lg:text-[28px] lg:tracking-[-0.9px]">
          Ringkasan keuangan
        </h1>
        <p className="text-[13px] leading-[23px] text-ink-lead lg:col-span-2 lg:row-start-2 lg:leading-[22px]">
          {`Assalamu’alaikum, ${firstName(shell.user.name)}. Berikut kondisi kas ${overview.mosqueName} ${isThisMonth ? "bulan ini" : "pada periode ini"}.`}
        </p>
        <div className="lg:col-start-2 lg:row-start-1">
          <DateRangePicker
            value={overview.range}
            onChange={(range) => navigate({ search: range })}
          />
        </div>
      </header>

      <SummaryCards
        current={overview.current}
        previous={overview.previous}
        closingBalance={overview.closingBalance}
        isFullMonth={isFullMonth(overview.range)}
      />

      {overview.current.count === 0 ? (
        <InfoNote className="border border-[#dbe4d5] p-4">
          Tidak ada transaksi pada periode ini. Saldo kas tetap menghitung semua transaksi sebelum
          tanggal akhir.
        </InfoNote>
      ) : null}

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <CashflowChart data={overview.monthly} />
        <QuickActions role={overview.role} />
      </div>

      <RecentTransactions
        transactions={overview.recent}
        showReportLink={overview.role !== "viewer"}
      />
    </PageContainer>
  );
}

function DashboardSkeleton() {
  return (
    <PageContainer
      className="gap-5 px-5 pt-7 pb-8 sm:px-6 lg:gap-[22px] lg:p-8"
      aria-busy="true"
      aria-label="Memuat ringkasan keuangan"
    >
      <Skeleton className="h-9 w-64 rounded-lg bg-muted-surface" />
      <Skeleton className="h-5 w-96 max-w-full rounded-lg bg-muted-surface" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[119px] rounded-[10px] bg-muted-surface" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[330px] rounded-[10px] bg-muted-surface" />
        <Skeleton className="h-[303px] rounded-[10px] bg-muted-surface" />
      </div>
    </PageContainer>
  );
}

function DashboardError() {
  return (
    <PageError
      title="Ringkasan gagal dimuat"
      message="Data keuangan tidak dapat diambil. Periksa koneksi Anda, lalu coba lagi."
    />
  );
}
