import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import type { ReactNode } from "react";

const toneClassName = {
  brand: "bg-info-surface text-brand",
  income: "bg-income-surface text-income",
  expense: "bg-expense-surface text-expense",
  neutral: "bg-canvas text-ink-muted",
} as const;

export type BadgeTone = keyof typeof toneClassName;

/** Small rounded label for roles, statuses, file types and audit actions. */
export function StatusBadge({
  tone = "neutral",
  dot,
  children,
  className,
}: {
  tone?: BadgeTone;
  /** "filled" for active states, "hollow" for inactive ones. */
  dot?: "filled" | "hollow";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold whitespace-nowrap",
        toneClassName[tone],
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            dot === "filled" ? "bg-current" : "border border-current",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}
