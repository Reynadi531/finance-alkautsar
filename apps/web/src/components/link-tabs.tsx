import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Link, type LinkProps } from "@tanstack/react-router";

export type LinkTab = { label: string; to: LinkProps["to"] };

/**
 * Underlined tab row where each tab is a route link ("Pemasukan | Pengeluaran").
 * The active tab follows the current URL; search params are not carried over.
 */
export function LinkTabs({
  items,
  label,
  className,
}: {
  items: readonly LinkTab[];
  /** Accessible name for the tab row. */
  label: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn("flex items-end gap-6 border-b border-control", className)}
    >
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: true, includeSearch: false }}
          className="-mb-px flex-1 border-b-2 border-canvas py-3 text-center text-sm text-ink-muted outline-none hover:text-ink focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-primary-action/30 sm:px-1 sm:text-left data-[status=active]:border-primary-action data-[status=active]:font-semibold data-[status=active]:text-ink-strong"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
