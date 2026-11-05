import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";

/** Page heading: optional breadcrumb, title, short purpose text, then a row of actions. */
export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
}: {
  title: string;
  description?: ReactNode;
  /** One control or several (wrap them in a fragment); they sit in a row under the text. */
  action?: ReactNode;
  breadcrumbs?: readonly string[];
}) {
  return (
    <header className="flex flex-col gap-3">
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      <h1 className="font-display text-2xl font-semibold tracking-[-0.8px] text-ink sm:text-[28px]">
        {title}
      </h1>
      {description ? (
        <p className="text-[13px] leading-[23px] text-ink-lead">{description}</p>
      ) : null}
      {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
    </header>
  );
}
