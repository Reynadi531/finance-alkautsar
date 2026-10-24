import type { ReactNode } from "react";

/** Page heading row with an optional control on the right, plus short purpose text. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink sm:text-[28px]">{title}</h1>
        {action}
      </div>
      {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
    </header>
  );
}
