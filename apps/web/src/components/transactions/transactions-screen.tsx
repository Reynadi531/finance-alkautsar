import { Skeleton } from "@keuangan-alkautsar/ui/components/skeleton";
import { useRouter } from "@tanstack/react-router";
import { CalendarDays, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ActionButton, actionButtonVariants } from "@/components/action-button";
import { AppSelect } from "@/components/app-select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageContainer, PageError } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/search-input";
import { TablePagination } from "@/components/table-pagination";
import {
  deleteTransaction,
  getTransactionPage,
  type TransactionPageData,
} from "@/functions/transactions";
import { todayIso } from "@/lib/date-range";
import { formatRupiah } from "@/lib/money";

import { ImportDialog } from "./import-dialog";
import {
  TRANSACTION_PAGE_SIZE,
  formatMonth,
  kindCopy,
  monthOf,
  resolveMonth,
  type TransactionKind,
  type TransactionSearch,
} from "./model";
import { TransactionDetailDialog } from "./transaction-detail-dialog";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { TransactionInsight, TransactionSummary } from "./transaction-summary";
import { TransactionTable, type TransactionListRow } from "./transaction-table";

/** Loader deps for both list routes; `add` is excluded so opening the dialog never refetches. */
export function transactionLoaderDeps({ search }: { search: TransactionSearch }) {
  return { month: search.month, q: search.q, page: search.page };
}

/** Route loader shared by S02 and S03. */
export function loadTransactions(
  kind: TransactionKind,
  deps: ReturnType<typeof transactionLoaderDeps>,
) {
  return getTransactionPage({
    data: {
      kind,
      month: resolveMonth(deps, monthOf(todayIso())),
      q: deps.q ?? "",
      page: deps.page ?? 1,
    },
  });
}

type SearchPatch = Partial<TransactionSearch>;

type EditorState = { open: boolean; row: TransactionListRow | null; key: number };

/**
 * Income (S02) and expense (S03) list screen. The route supplies loader data and a way to
 * update its search params; everything else is shared and switches on `data.kind`.
 */
export function TransactionsScreen({
  data,
  search,
  mosqueName,
  onSearchChange,
}: {
  data: TransactionPageData;
  search: TransactionSearch;
  mosqueName: string;
  onSearchChange: (patch: SearchPatch, options?: { replace?: boolean }) => void;
}) {
  const { kind } = data;
  const copy = kindCopy[kind];
  const router = useRouter();

  const [editor, setEditor] = useState<EditorState>({ open: false, row: null, key: 0 });
  const [detail, setDetail] = useState<{ open: boolean; row: TransactionListRow | null }>({
    open: false,
    row: null,
  });
  const [importOpen, setImportOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TransactionListRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openEditor = useCallback((row: TransactionListRow | null) => {
    setEditor((previous) => ({ open: true, row, key: previous.key + 1 }));
  }, []);

  // `?add=1` (dashboard quick actions) opens the add dialog on arrival.
  useEffect(() => {
    if (search.add) openEditor(null);
  }, [search.add, openEditor]);

  function closeEditor() {
    setEditor((previous) => ({ ...previous, open: false }));
    if (search.add) onSearchChange({ add: undefined }, { replace: true });
  }

  const thisMonth = monthOf(todayIso());
  const periodText = data.month === "all" ? "semua bulan" : formatMonth(data.month);
  const scopeLabel =
    data.month === "all"
      ? "secara keseluruhan"
      : data.month === thisMonth
        ? "bulan ini"
        : `pada ${periodText}`;

  const monthOptions = [
    { value: "all", label: "Semua bulan" },
    ...[...new Set([...(data.month === "all" ? [] : [data.month]), ...data.months])]
      .sort()
      .reverse()
      .map((month) => ({ value: month, label: formatMonth(month) })),
  ];

  const exportParams = new URLSearchParams({ kind, month: data.month });
  if (data.q) exportParams.set("q", data.q);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const { ref } = await deleteTransaction({ data: { id: toDelete.id } });
      toast.success(`Transaksi ${ref} dihapus.`);
      setToDelete(null);
      if (data.rows.length === 1 && data.page > 1) {
        onSearchChange({ page: data.page - 1 });
      }
      await router.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : "Transaksi gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const emptyMessage = data.q ? (
    <div className="flex flex-col items-center gap-3">
      <p>
        Tidak ada {copy.noun} yang cocok dengan “{data.q}” pada {periodText}.
      </p>
      <ActionButton
        tone="outline"
        size="sm"
        onClick={() => onSearchChange({ q: undefined, page: undefined, month: data.month })}
      >
        Hapus pencarian
      </ActionButton>
    </div>
  ) : data.total > 0 ? (
    <div className="flex flex-col items-center gap-3">
      <p>Halaman ini kosong.</p>
      <ActionButton tone="outline" size="sm" onClick={() => onSearchChange({ page: undefined })}>
        Ke halaman pertama
      </ActionButton>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3">
      <p>
        Belum ada {copy.noun} tercatat pada {periodText}.
      </p>
      <ActionButton tone={kind} size="sm" onClick={() => openEditor(null)}>
        {copy.addLabel}
      </ActionButton>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        title={copy.title}
        description={copy.description}
        action={
          <>
            <ActionButton tone="outline" onClick={() => setImportOpen(true)}>
              Impor CSV
            </ActionButton>
            <ActionButton tone={kind} onClick={() => openEditor(null)}>
              {copy.addLabel}
            </ActionButton>
          </>
        }
      />

      <TransactionSummary
        kind={kind}
        month={data.month}
        isCurrentMonth={data.month === thisMonth}
        previousMonth={data.previousMonth}
        current={data.summary.current}
        previous={data.summary.previous}
      />

      <TransactionInsight
        kind={kind}
        topCategory={data.topCategory}
        scopeLabel={scopeLabel}
        showCategoryLink={data.role === "admin"}
      />

      <Panel aria-labelledby="transaction-list-title" className="border border-line p-5 sm:p-5">
        <div className="flex flex-col gap-4 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <h2 id="transaction-list-title" className="font-display text-[17px] font-bold text-ink">
              {copy.listTitle}
            </h2>
            <p className="text-[11px] text-ink-subtle">
              {data.q ? `Hasil pencarian “${data.q}”` : "Menampilkan transaksi terbaru"} ·{" "}
              {periodText}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={data.q}
              onSearch={(value) =>
                onSearchChange({ q: value.trim() || undefined, page: undefined, month: data.month })
              }
              placeholder="Cari transaksi..."
              aria-label={`Cari ${copy.noun}`}
              className="w-full sm:w-[245px]"
            />
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <AppSelect
                variant="filter"
                aria-label="Bulan"
                value={data.month}
                onValueChange={(month) =>
                  onSearchChange({ month: month as TransactionSearch["month"], page: undefined })
                }
                options={monthOptions}
                className="pl-8"
              />
            </div>
            <a
              href={`/api/transaksi/ekspor?${exportParams}`}
              download
              className={actionButtonVariants({ tone: "outline" })}
            >
              <Download aria-hidden />
              Ekspor
            </a>
          </div>
        </div>

        <TransactionTable
          rows={data.rows}
          emptyMessage={emptyMessage}
          onView={(row) => setDetail({ open: true, row })}
          onEdit={(row) => openEditor(row)}
          onDelete={setToDelete}
        />

        <TablePagination
          page={data.page}
          pageSize={TRANSACTION_PAGE_SIZE}
          total={data.total}
          noun="transaksi"
          onPageChange={(page) => onSearchChange({ page: page > 1 ? page : undefined })}
          className="border-t border-line"
        />
      </Panel>

      <TransactionFormDialog
        key={editor.key}
        kind={kind}
        open={editor.open}
        onOpenChange={(open) => (open ? undefined : closeEditor())}
        row={editor.row}
        categories={data.categories}
        mosqueName={mosqueName}
        onSaved={() => {
          closeEditor();
          void router.invalidate();
        }}
      />

      <TransactionDetailDialog
        kind={kind}
        open={detail.open}
        onOpenChange={(open) => setDetail((previous) => ({ ...previous, open }))}
        row={detail.row}
        onEdit={(row) => {
          setDetail((previous) => ({ ...previous, open: false }));
          openEditor(row);
        }}
      />

      <ImportDialog
        kind={kind}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          setImportOpen(false);
          void router.invalidate();
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setToDelete(null);
        }}
        title={`Hapus ${copy.noun}?`}
        description={
          toDelete ? (
            <>
              Transaksi{" "}
              <strong className="text-ink">
                {toDelete.categoryName} · {toDelete.ref}
              </strong>{" "}
              sebesar <strong className="text-ink">{formatRupiah(toDelete.amount)}</strong> akan
              dihapus dari daftar, ringkasan, dan laporan. Riwayat perubahan tetap menyimpan
              catatannya.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Hapus transaksi"
        onConfirm={confirmDelete}
        pending={deleting}
      />
    </PageContainer>
  );
}

/** `pendingComponent` for both list routes. */
export function TransactionsSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-label="Memuat transaksi">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-56 rounded-lg bg-white" />
        <Skeleton className="h-[38px] w-64 rounded-lg bg-white" />
      </div>
      <Skeleton className="h-5 w-80 max-w-full rounded-lg bg-white" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[153px] rounded-xl bg-white" />
        ))}
      </div>
      <Skeleton className="h-[88px] rounded-[10px] bg-white" />
      <Skeleton className="h-[480px] rounded-xl bg-white" />
    </PageContainer>
  );
}

/** `errorComponent` for both list routes. */
export function TransactionsError({ kind }: { kind: TransactionKind }) {
  return (
    <PageError
      title={`Daftar ${kindCopy[kind].noun} gagal dimuat`}
      message="Data transaksi tidak dapat diambil. Periksa koneksi Anda, lalu coba lagi."
    />
  );
}
