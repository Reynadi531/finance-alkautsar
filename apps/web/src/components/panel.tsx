import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

/** White rounded surface used for every content block on app screens. */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("flex flex-col rounded-xl bg-white p-5 sm:p-[22px]", className)}
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
      <div className="flex flex-col gap-3.5">
        <h2 id={titleId} className="font-display text-[17px] font-bold text-ink">
          {title}
        </h2>
        {description ? <p className="text-xs text-ink-subtle">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
