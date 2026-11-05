import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

/** White rounded surface used for every content block on app screens. */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-[10px] border border-line bg-white p-5 shadow-card sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  description,
  action,
  titleId,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  titleId?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
          {title}
        </h2>
        {description ? <p className="text-xs text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
