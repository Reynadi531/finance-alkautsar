import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Page numbers with ellipses: 1 … 4 5 6 … 22. */
export function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);
  return sorted.flatMap((value, index) =>
    index > 0 && value - sorted[index - 1] > 1 ? (["gap", value] as const) : [value],
  );
}

/**
 * Footer for paginated lists: "Menampilkan 1–5 dari 24 transaksi" plus page controls.
 * `page` is 1-based; `onPageChange` usually updates the `page` search param.
 */
export function TablePagination({
  page,
  pageSize,
  total,
  noun,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** Plural noun for the summary, e.g. "transaksi" or "pengguna". */
  noun: string;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  const control =
    "flex size-[30px] items-center justify-center rounded-md border border-line bg-white text-xs font-bold text-ink-body outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand/30 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-xs text-ink-muted" aria-live="polite">
        Menampilkan {first}–{last} dari {total} {noun}
      </p>
      {pageCount > 1 ? (
        <nav aria-label="Navigasi halaman" className="flex items-center gap-1.5">
          <button
            type="button"
            className={control}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </button>
          {pageWindow(page, pageCount).map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-xs text-ink-muted" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={cn(
                  control,
                  item === page && "border-brand bg-brand text-white hover:bg-brand",
                )}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Halaman ${item}`}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className={control}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
