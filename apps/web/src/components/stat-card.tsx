import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import type { ReactNode } from "react";

const toneClassName = {
  income: "text-income",
  expense: "text-expense",
  balance: "text-balance",
  neutral: "text-count",
} as const;

export type StatTone = keyof typeof toneClassName;

/** Summary figure: small caps label, large value, one line of context. */
export function StatCard({
  label,
  value,
  caption,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  tone?: StatTone;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-xl bg-white p-5">
      <p className="text-[11px] font-bold tracking-wide text-ink-label uppercase">{label}</p>
      <p
        className={cn(
          "truncate font-display text-[23px] font-bold tabular-nums",
          toneClassName[tone],
        )}
      >
        {value}
      </p>
      {caption ? <div className="text-xs text-ink-subtle">{caption}</div> : null}
    </div>
  );
}
