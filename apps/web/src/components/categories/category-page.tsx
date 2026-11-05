import { Skeleton } from "@keuangan-alkautsar/ui/components/skeleton";
import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Plus,
  ShieldAlert,
  Tags,
} from "lucide-react";
import { useCallback, useState } from "react";

import { ActionButton, actionButtonVariants } from "@/components/action-button";
import { AppSelect } from "@/components/app-select";
import { CategoryDialog } from "@/components/categories/category-dialog";
import {
  categoryKinds,
  type CategoryKind,
  type CategorySearch,
  type CategoryStatus,
} from "@/components/categories/category-kinds";
import { DataTable, TableMessage, Td, Th, Tr } from "@/components/data-table";
import { LinkTabs } from "@/components/link-tabs";
import { PageContainer } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/search-input";
import { StatCard } from "@/components/stat-card";
import type { CategoryList, CategoryListItem } from "@/functions/categories";

const tabs = [
  { label: categoryKinds.income.tabLabel, to: categoryKinds.income.to },
  { label: categoryKinds.expense.tabLabel, to: categoryKinds.expense.to },
] as const;

const statusOptions = [
  { value: "all", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "archived", label: "Diarsipkan" },
] as const satisfies readonly { value: CategoryStatus; label: string }[];

const statusNoun: Record<CategoryStatus, string> = {
  all: "tipe",
  active: "tipe aktif",
  archived: "tipe diarsipkan",
};

export const DEFAULT_CATEGORY_STATUS: CategoryStatus = "active";

function breadcrumbs(kind: CategoryKind) {
  return ["Keuangan", "Tipe Transaksi", categoryKinds[kind].tabLabel] as const;
}

/** Shared body of S04/S05: header, kind tabs, summary, filterable list and add/edit dialog. */
export function CategoryPage({
  kind,
  data,
  search,
  onSearchChange,
}: {
  kind: CategoryKind;
  data: CategoryList;
  search: CategorySearch;
  onSearchChange: (next: CategorySearch) => void;
}) {
  const config = categoryKinds[kind];
  const status = search.status ?? DEFAULT_CATEGORY_STATUS;
  const query = search.q ?? "";
  const [dialog, setDialog] = useState<{
    open: boolean;
    category: CategoryListItem | null;
    key: number;
  }>({ open: false, category: null, key: 0 });

  const openDialog = (category: CategoryListItem | null) =>
    setDialog((current) => ({ open: true, category, key: current.key + 1 }));

  const handleSearch = useCallback(
    (q: string) => onSearchChange({ ...search, q: q.trim() || undefined }),
    [onSearchChange, search],
  );

  const { stats } = data;
  const hasAny = stats.active + stats.archived > 0;
  const selectedId = dialog.open ? dialog.category?.id : undefined;

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs(kind)}
        title={config.title}
        description={config.description}
        action={
          <ActionButton tone="brand" onClick={() => openDialog(null)} className="w-full sm:w-auto">
            <Plus aria-hidden />
            Tambah tipe
          </ActionButton>
        }
      />

      <LinkTabs items={tabs} label="Jenis tipe transaksi" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Tipe aktif"
          value={stats.active}
          caption={config.activeCaption}
          icon={Tags}
        />
        <StatCard
          label={config.usedLabel}
          value={stats.usedThisMonth}
          caption={config.usedCaption(stats.transactionsThisMonth)}
          icon={ArrowLeftRight}
        />
        <StatCard
          label="Tipe diarsipkan"
          value={stats.archived}
          caption={config.archivedCaption}
          icon={Archive}
        />
      </div>

      <Panel aria-labelledby="category-list-title" className="gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="category-list-title"
            className="font-display text-lg font-semibold text-ink sm:min-w-0 sm:flex-1"
          >
            Daftar tipe {config.noun}
          </h2>
          <AppSelect
            variant="filter"
            aria-label="Filter status tipe"
            value={status}
            options={statusOptions}
            onValueChange={(value) =>
              onSearchChange({
                ...search,
                status: value === DEFAULT_CATEGORY_STATUS ? undefined : (value as CategoryStatus),
              })
            }
            className="w-full justify-between rounded-lg border-control px-4 font-semibold text-ink data-[size=default]:h-12 sm:w-auto sm:min-w-[105px]"
          />
        </div>
        <p className="-mt-2 text-xs text-ink-muted">
          {stats.active} aktif
          {stats.archived > 0 ? ` · ${stats.archived} diarsipkan` : ""} · urut berdasarkan nama
        </p>

        {hasAny ? (
          <>
            <SearchInput
              value={query}
              onSearch={handleSearch}
              placeholder={config.searchPlaceholder}
              aria-label={`Cari tipe ${config.noun}`}
            />

            <DataTable className="min-w-[560px]" aria-label={`Daftar tipe ${config.noun}`}>
              <thead>
                <tr>
                  <Th className="pl-4">Nama tipe / kode</Th>
                  <Th className="w-[34%]">Dipakai</Th>
                  <Th className="w-[110px] pr-4 text-right">Tindakan</Th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <TableMessage colSpan={3}>
                    {query ? (
                      <>
                        Tidak ada {statusNoun[status]} yang cocok dengan “{query}”.
                      </>
                    ) : status === "archived" ? (
                      "Belum ada tipe yang diarsipkan."
                    ) : (
                      <NoActiveMessage
                        noun={config.noun}
                        transactionLabel={config.transactionLabel}
                        onAdd={() => openDialog(null)}
                      />
                    )}
                  </TableMessage>
                ) : (
                  data.items.map((item) => (
                    <CategoryRow
                      key={item.id}
                      item={item}
                      selected={item.id === selectedId}
                      onEdit={() => openDialog(item)}
                    />
                  ))
                )}
              </tbody>
            </DataTable>

            <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-muted" aria-live="polite">
                Menampilkan {data.items.length} dari {data.statusTotal} {statusNoun[status]}
              </p>
              {status === "active" && stats.archived > 0 ? (
                <Link
                  to={config.to}
                  search={{ status: "archived" }}
                  className="inline-flex items-center gap-1.5 self-start rounded-sm text-xs font-semibold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-action/30"
                >
                  Lihat {stats.archived} tipe diarsipkan
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              ) : status !== "active" ? (
                <Link
                  to={config.to}
                  search={{}}
                  className="inline-flex items-center gap-1.5 self-start rounded-sm text-xs font-semibold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-action/30"
                >
                  Lihat {stats.active} tipe aktif
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              ) : null}
            </div>
          </>
        ) : (
          <EmptyState
            noun={config.noun}
            transactionLabel={config.transactionLabel}
            onAdd={() => openDialog(null)}
          />
        )}
      </Panel>

      <CategoryDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        config={config}
        category={dialog.category}
        nextCode={data.nextCode}
        formKey={dialog.key}
      />
    </PageContainer>
  );
}

function CategoryRow({
  item,
  selected,
  onEdit,
}: {
  item: CategoryListItem;
  selected: boolean;
  onEdit: () => void;
}) {
  return (
    <Tr className={cn(selected && "bg-info-surface")}>
      <Td className="py-[15px] pl-4">
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              "text-[13px] leading-4 font-bold",
              selected ? "text-ink-strong" : item.archived ? "text-ink-muted" : "text-ink",
            )}
          >
            {item.name}
          </span>
          <span className="text-[11px] leading-[13px] text-ink-muted">
            {item.code}
            <span aria-hidden className="mx-2">
              ·
            </span>
            {item.archived ? "Diarsipkan" : "Aktif"}
          </span>
        </div>
      </Td>
      <Td className="text-xs text-ink-muted">{item.transactionCount} transaksi</Td>
      <Td className="pr-4 text-right">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Ubah ${item.name}`}
          className="inline-flex items-center gap-1.5 rounded-sm text-xs font-semibold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-action/30"
        >
          {selected ? "Dipilih" : "Ubah"}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </button>
      </Td>
    </Tr>
  );
}

function NoActiveMessage({
  noun,
  transactionLabel,
  onAdd,
}: {
  noun: string;
  transactionLabel: string;
  onAdd: () => void;
}) {
  return (
    <span className="flex flex-col items-center gap-3">
      <span>
        Belum ada tipe {noun} aktif. Minimal satu tipe aktif dibutuhkan sebelum mencatat{" "}
        {transactionLabel}.
      </span>
      <ActionButton tone="brand" size="sm" onClick={onAdd}>
        <Plus aria-hidden />
        Tambah tipe
      </ActionButton>
    </span>
  );
}

function EmptyState({
  noun,
  transactionLabel,
  onAdd,
}: {
  noun: string;
  transactionLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-lg bg-empty-surface p-6 text-center">
      <Tags className="size-8 text-ink-subtle" aria-hidden />
      <h3 className="font-display text-[17px] font-semibold text-ink">Belum ada tipe {noun}</h3>
      <p className="max-w-md text-xs leading-[22px] text-ink-muted">
        Tambahkan minimal satu tipe {noun} sebelum mencatat {transactionLabel}. Tipe membantu
        laporan kas tetap rapi dan mudah ditelusuri.
      </p>
      <ActionButton tone="brand" onClick={onAdd} className="w-full sm:w-auto">
        <Plus aria-hidden />
        Tambah tipe
      </ActionButton>
    </div>
  );
}

/** Route `pendingComponent` for both category screens. */
export function CategoryPageSkeleton({ kind }: { kind: CategoryKind }) {
  return (
    <PageContainer
      aria-busy="true"
      aria-label={`Memuat ${categoryKinds[kind].title.toLowerCase()}`}
    >
      <Skeleton className="h-4 w-56 rounded-md bg-white" />
      <Skeleton className="h-9 w-64 rounded-lg bg-white" />
      <Skeleton className="h-5 w-[520px] max-w-full rounded-lg bg-white" />
      <Skeleton className="h-7 w-52 rounded-lg bg-white" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[111px] rounded-[10px] bg-white" />
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-[10px] bg-white" />
    </PageContainer>
  );
}

/** Shown to treasurers/viewers who open the URL directly; the nav already hides it. */
export function CategoryNoAccess({ kind }: { kind: CategoryKind }) {
  return (
    <PageContainer>
      <PageHeader breadcrumbs={breadcrumbs(kind)} title={categoryKinds[kind].title} />
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-[10px] border border-line bg-white p-6 shadow-card"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-expense-surface text-expense">
          <ShieldAlert className="size-5" aria-hidden />
        </span>
        <h2 className="font-display text-lg font-semibold text-ink">Tidak ada akses</h2>
        <p className="text-sm text-ink-muted">
          Hanya administrator yang dapat mengelola tipe transaksi. Tipe yang aktif tetap bisa Anda
          pilih saat mencatat transaksi.
        </p>
        <Link to="/dashboard" className={actionButtonVariants({ tone: "outline" })}>
          Kembali ke dashboard
        </Link>
      </div>
    </PageContainer>
  );
}
