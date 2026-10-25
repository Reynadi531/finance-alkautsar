import { Skeleton } from "@keuangan-alkautsar/ui/components/skeleton";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import z from "zod";

import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/page-header";
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
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-8 lg:px-11 lg:py-[38px]">
      <PageHeader
        title="Ringkasan keuangan"
        description={`Assalamu’alaikum, ${firstName(shell.user.name)}. Berikut kondisi kas ${overview.mosqueName} ${isThisMonth ? "bulan ini" : "pada periode ini"}.`}
        action={
          <DateRangePicker
            value={overview.range}
            onChange={(range) => navigate({ search: range })}
          />
        }
      />

      <SummaryCards
        current={overview.current}
        previous={overview.previous}
        closingBalance={overview.closingBalance}
        isFullMonth={isFullMonth(overview.range)}
      />

      {overview.current.count === 0 ? (
        <p className="-mt-2 rounded-lg bg-white px-4 py-3 text-[13px] text-ink-muted">
          Tidak ada transaksi pada periode ini. Saldo kas tetap menghitung semua transaksi sebelum
          tanggal akhir.
        </p>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[minmax(0,690fr)_minmax(0,404fr)]">
        <CashflowChart data={overview.monthly} />
        <QuickActions role={overview.role} />
      </div>

      <RecentTransactions
        transactions={overview.recent}
        showReportLink={overview.role !== "viewer"}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 px-4 py-6 sm:px-8 lg:px-11 lg:py-[38px]"
      aria-busy="true"
      aria-label="Memuat ringkasan keuangan"
    >
      <Skeleton className="h-9 w-64 rounded-lg bg-white" />
      <Skeleton className="h-5 w-96 max-w-full rounded-lg bg-white" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[119px] rounded-xl bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[690fr_404fr]">
        <Skeleton className="h-[330px] rounded-xl bg-white" />
        <Skeleton className="h-[303px] rounded-xl bg-white" />
      </div>
    </div>
  );
}

function DashboardError() {
  const router = useRouter();
  return (
    <div className="px-4 py-6 sm:px-8 lg:px-11 lg:py-[38px]">
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-white p-6">
        <h1 className="font-display text-xl font-bold text-ink">Ringkasan gagal dimuat</h1>
        <p className="text-sm text-ink-muted">
          Data keuangan tidak dapat diambil. Periksa koneksi Anda, lalu coba lagi.
        </p>
        <button
          type="button"
          onClick={() => router.invalidate()}
          className="rounded-lg bg-income px-4 py-2 text-[13px] font-bold text-white hover:bg-income/90"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}
