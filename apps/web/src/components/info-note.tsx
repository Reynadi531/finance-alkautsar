import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

/** Tinted blue callout for explanatory notes in dialogs and below reports. */
export function InfoNote({
  children,
  icon = true,
  className,
}: {
  children: ReactNode;
  icon?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg bg-info-surface px-3.5 py-3 text-xs text-info-foreground",
        className,
      )}
    >
      {icon ? <Info className="mt-px size-3.5 shrink-0" aria-hidden /> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
