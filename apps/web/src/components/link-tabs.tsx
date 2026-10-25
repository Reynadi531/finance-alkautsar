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
    <nav aria-label={label} className={cn("flex items-end gap-5", className)}>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: true, includeSearch: false }}
          className="-mb-px border-b-2 border-transparent px-0.5 pb-2.5 text-sm text-ink-muted outline-none hover:text-ink focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-brand/30 data-[status=active]:border-brand data-[status=active]:font-bold data-[status=active]:text-brand"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
