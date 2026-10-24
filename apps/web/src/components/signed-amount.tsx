import { cn } from "@keuangan-alkautsar/ui/lib/utils";

import { formatRupiah } from "@/lib/money";

/** Transaction amount with an explicit +/− sign so direction never relies on color alone. */
export function SignedAmount({
  kind,
  amount,
  className,
}: {
  kind: "income" | "expense";
  amount: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[13px] font-bold whitespace-nowrap tabular-nums",
        kind === "income" ? "text-income" : "text-expense",
        className,
      )}
    >
      {kind === "income" ? "+" : "−"} {formatRupiah(amount)}
    </span>
  );
}
