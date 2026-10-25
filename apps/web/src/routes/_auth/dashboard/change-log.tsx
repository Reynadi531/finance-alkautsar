import { Skeleton } from "@keuangan-alkautsar/ui/components/skeleton";
import { createFileRoute, type ErrorComponentProps } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { ActiveFilterBanner } from "@/components/change-log/active-filter-banner";
import { ChangeLogDetailDialog } from "@/components/change-log/change-log-detail-dialog";
import { ChangeLogStats } from "@/components/change-log/change-log-stats";
import { ChangeLogEmpty, ChangeLogTable } from "@/components/change-log/change-log-table";
import { ChangeLogToolbar, type FilterPatch } from "@/components/change-log/change-log-toolbar";
import { ExportButton } from "@/components/change-log/export-button";
import {
  CHANGE_LOG_PAGE_SIZE,
  activeFilterCount,
  changeLogSearchSchema,
  type ChangeLogFilters,
} from "@/components/change-log/filters";
import { PageContainer, PageError } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { TablePagination } from "@/components/table-pagination";
import { getChangeLog, type ChangeLogEntry } from "@/functions/change-log";

const breadcrumbs = ["Beranda", "Pengaturan", "Riwayat Perubahan"] as const;
const description = "Pantau aktivitas dan perubahan data keuangan masjid.";

export const Route = createFileRoute("/_auth/dashboard/change-log")({
  validateSearch: changeLogSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getChangeLog({ data: deps }),
  head: () => ({ meta: [{ title: "Riwayat Perubahan · ruangmasjid" }] }),
  component: ChangeLogPage,
  pendingComponent: ChangeLogSkeleton,
  errorComponent: ChangeLogError,
});

const number = new Intl.NumberFormat("id-ID");

function ChangeLogPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [selected, setSelected] = useState<ChangeLogEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { page = 1, ...filters } = search;
  const filterCount = activeFilterCount(filters);
  const filtered = filterCount > 0;
  const pageCount = Math.max(1, Math.ceil(data.total / CHANGE_LOG_PAGE_SIZE));

  const updateFilters = useCallback(
    (patch: FilterPatch) =>
      navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }), replace: true }),
    [navigate],
  );
  const resetFilters = () => navigate({ search: {}, replace: true });

  // A stale `page` (e.g. after the list shrank) falls back to the last page.
  useEffect(() => {
    if (page > pageCount) {
      navigate({
        search: (prev) => ({ ...prev, page: pageCount > 1 ? pageCount : undefined }),
        replace: true,
      });
    }
  }, [page, pageCount, navigate]);

  const actorName = filters.actor
    ? (data.actors.find((actor) => actor.id === filters.actor)?.name ?? null)
    : null;

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Riwayat Perubahan"
        description={description}
        action={<ExportButton filters={filters satisfies ChangeLogFilters} filtered={filtered} />}
      />

      <ChangeLogStats {...data.stats} />

      <section aria-labelledby="change-log-list-title" className="flex flex-col gap-[15px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="change-log-list-title" className="font-display text-base font-bold text-ink">
            {filtered ? "Hasil aktivitas" : "Aktivitas terbaru"}
          </h2>
          <p className="text-[11px] text-ink-muted">
            {filtered
              ? `${number.format(data.total)} aktivitas ditemukan`
              : `Menampilkan ${data.rows.length} dari ${number.format(data.total)} aktivitas`}
          </p>
        </div>

        {filtered ? (
          <ActiveFilterBanner
            filters={filters}
            total={data.total}
            actorName={actorName}
            onReset={resetFilters}
          />
        ) : null}

        <ChangeLogToolbar filters={filters} actors={data.actors} onChange={updateFilters} />

        <ChangeLogTable
          rows={data.rows}
          onOpen={(entry) => {
            setSelected(entry);
            setDetailOpen(true);
          }}
          empty={
            data.hasHistory ? (
              <ChangeLogEmpty variant="no-match" onReset={filtered ? resetFilters : undefined} />
            ) : (
              <ChangeLogEmpty variant="no-history" />
            )
          }
        />

        {data.total > 0 ? (
          <TablePagination
            className="pt-0"
            page={Math.min(page, pageCount)}
            pageSize={CHANGE_LOG_PAGE_SIZE}
            total={data.total}
            noun="aktivitas"
            onPageChange={(next) =>
              navigate({ search: (prev) => ({ ...prev, page: next > 1 ? next : undefined }) })
            }
          />
        ) : null}
      </section>

      <p className="text-[11px] text-ink-muted">
        Setiap perubahan tercatat otomatis untuk menjaga transparansi dan akuntabilitas.
      </p>

      <ChangeLogDetailDialog entry={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </PageContainer>
  );
}

function ChangeLogSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-label="Memuat riwayat perubahan">
      <Skeleton className="h-3 w-56 rounded bg-white" />
      <Skeleton className="h-9 w-72 max-w-full rounded-lg bg-white" />
      <Skeleton className="h-4 w-96 max-w-full rounded bg-white" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[91px] rounded-lg bg-white" />
        ))}
      </div>
      <Skeleton className="h-[38px] w-full rounded-lg bg-white" />
      <Skeleton className="h-[434px] w-full rounded-[9px] bg-white" />
    </PageContainer>
  );
}

function ChangeLogError({ error }: ErrorComponentProps) {
  const forbidden = error instanceof Error && error.message.includes("akses");
  return (
    <PageError
      title={forbidden ? "Akses ditolak" : "Riwayat perubahan gagal dimuat"}
      message={
        forbidden
          ? "Riwayat perubahan hanya dapat dilihat oleh administrator dan bendahara."
          : "Riwayat perubahan tidak dapat diambil. Periksa koneksi Anda, lalu coba lagi."
      }
    />
  );
}
