import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const toneClassName = {
  income: "text-income",
  expense: "text-expense",
  balance: "text-balance",
  neutral: "text-ink-strong",
} as const;

export type StatTone = keyof typeof toneClassName;

/** Summary figure: label with optional icon, large value, one line of context. */
export function StatCard({
  label,
  value,
  caption,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  tone?: StatTone;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-[10px] border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-xs font-semibold text-ink-label">{label}</p>
        {Icon ? <Icon className="size-[18px] shrink-0 text-ink-strong" aria-hidden /> : null}
      </div>
      <p
        className={cn(
          "truncate font-display text-[26px] font-semibold tracking-[-0.8px] tabular-nums sm:text-[30px]",
          toneClassName[tone],
        )}
      >
        {value}
      </p>
      {caption ? <div className="text-[11px] leading-[18px] text-ink-muted">{caption}</div> : null}
    </div>
  );
}
