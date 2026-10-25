import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

/**
 * Table primitives for app lists: tinted uppercase header, divided rows, horizontal scroll
 * on narrow screens. Compose `DataTable` > `thead`/`tbody` with `Th`, `Tr`, `Td`.
 */
export function DataTable({ className, children, ...props }: ComponentProps<"table">) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className={cn("w-full min-w-[720px] border-collapse text-left", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "bg-canvas px-2.5 py-3 text-[10px] font-bold tracking-[0.08em] whitespace-nowrap text-ink-label uppercase first:rounded-l-lg last:rounded-r-lg",
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-b border-line last:border-b-0", className)} {...props} />;
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn("px-2.5 py-4 align-middle text-[13px] text-ink-body", className)}
      {...props}
    />
  );
}

/** Full-width row for loading/empty messages inside a table body. */
export function TableMessage({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-2.5 py-10 text-center text-[13px] text-ink-muted">
        {children}
      </td>
    </tr>
  );
}
