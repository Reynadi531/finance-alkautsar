import { Skeleton } from "@keuangan-alkautsar/ui/components/skeleton";
import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Plus, Rows3, ShieldAlert } from "lucide-react";
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
    <PageContainer className="gap-[23px]">
      <PageHeader
        breadcrumbs={breadcrumbs(kind)}
        title={config.title}
        description={config.description}
        action={
          <ActionButton tone="brand" onClick={() => openDialog(null)}>
            <Plus aria-hidden />
            Tambah tipe
          </ActionButton>
        }
      />

      <LinkTabs items={tabs} label="Jenis tipe transaksi" className="-mt-1" />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <StatCard label="Tipe aktif" value={stats.active} caption={config.activeCaption} />
        <StatCard
          label={config.usedLabel}
          value={stats.usedThisMonth}
          caption={config.usedCaption(stats.transactionsThisMonth)}
        />
        <StatCard label="Tipe diarsipkan" value={stats.archived} caption={config.archivedCaption} />
      </div>

      <Panel aria-labelledby="category-list-title" className="px-0 py-5 sm:px-0 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5">
          <div className="flex flex-col gap-[5px]">
            <h2 id="category-list-title" className="font-display text-[17px] font-bold text-ink">
              Daftar tipe {config.noun}
            </h2>
            <p className="text-xs text-ink-muted">
              {stats.active} aktif
              {stats.archived > 0 ? ` · ${stats.archived} diarsipkan` : ""} · urut berdasarkan nama
            </p>
          </div>
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
            className="text-brand"
          />
        </div>

        {hasAny ? (
          <>
            <div className="px-5 py-[17px]">
              <SearchInput
                value={query}
                onSearch={handleSearch}
                placeholder={config.searchPlaceholder}
                aria-label={`Cari tipe ${config.noun}`}
                className="[&_input]:bg-[#fafbfb]"
              />
            </div>

            <DataTable className="min-w-[560px]" aria-label={`Daftar tipe ${config.noun}`}>
              <thead>
                <tr>
                  <Th className="rounded-none pl-5 first:rounded-none">Nama tipe / kode</Th>
                  <Th className="w-[34%]">Dipakai</Th>
                  <Th className="w-[110px] rounded-none pr-5 text-right last:rounded-none">
                    Tindakan
                  </Th>
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

            <div className="flex flex-col gap-2 border-t border-line px-5 pt-[15px] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-muted" aria-live="polite">
                Menampilkan {data.items.length} dari {data.statusTotal} {statusNoun[status]}
              </p>
              {status === "active" && stats.archived > 0 ? (
                <Link
                  to={config.to}
                  search={{ status: "archived" }}
                  className="inline-flex items-center gap-1.5 self-start rounded-sm text-xs font-bold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
                >
                  Lihat {stats.archived} tipe diarsipkan
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              ) : status !== "active" ? (
                <Link
                  to={config.to}
                  search={{}}
                  className="inline-flex items-center gap-1.5 self-start rounded-sm text-xs font-bold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
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
      <Td className="py-[15px] pl-5">
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              "text-[13px] leading-4 font-bold",
              selected ? "text-brand" : item.archived ? "text-ink-muted" : "text-ink",
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
      <Td className="pr-5 text-right">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Ubah ${item.name}`}
          className="inline-flex items-center gap-1.5 rounded-sm text-xs font-bold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
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
    <div className="mx-5 mt-[17px] flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-info-surface text-brand">
        <Rows3 className="size-5" aria-hidden />
      </span>
      <h3 className="font-display text-base font-bold text-ink">Belum ada tipe {noun}</h3>
      <p className="max-w-md text-[13px] text-ink-muted">
        Tambahkan minimal satu tipe {noun} sebelum mencatat {transactionLabel}. Tipe membantu
        laporan kas tetap rapi dan mudah ditelusuri.
      </p>
      <ActionButton tone="brand" onClick={onAdd}>
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
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[111px] rounded-xl bg-white" />
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-xl bg-white" />
    </PageContainer>
  );
}

/** Shown to treasurers/viewers who open the URL directly; the nav already hides it. */
export function CategoryNoAccess({ kind }: { kind: CategoryKind }) {
  return (
    <PageContainer>
      <PageHeader breadcrumbs={breadcrumbs(kind)} title={categoryKinds[kind].title} />
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-white p-6">
        <span className="flex size-10 items-center justify-center rounded-full bg-expense-surface text-expense">
          <ShieldAlert className="size-5" aria-hidden />
        </span>
        <h2 className="font-display text-lg font-bold text-ink">Tidak ada akses</h2>
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
