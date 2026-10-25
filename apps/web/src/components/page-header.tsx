import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";

/** Page heading row with optional breadcrumb, actions on the right, and short purpose text. */
export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
}: {
  title: string;
  description?: ReactNode;
  /** One control or several (wrap them in a fragment); they align right on wide screens. */
  action?: ReactNode;
  breadcrumbs?: readonly string[];
}) {
  return (
    <header className="flex flex-col gap-3">
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink sm:text-[28px]">{title}</h1>
        {action ? <div className="flex flex-wrap items-center gap-2.5">{action}</div> : null}
      </div>
      {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
    </header>
  );
}
