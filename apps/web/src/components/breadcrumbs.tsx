import { Fragment } from "react";

/** Plain-text trail above a page title: "Keuangan / Tipe Transaksi / Pemasukan". */
export function Breadcrumbs({ items }: { items: readonly string[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        {items.map((item, index) => (
          <Fragment key={item}>
            {index > 0 ? (
              <li aria-hidden className="text-ink-subtle">
                /
              </li>
            ) : null}
            <li aria-current={index === items.length - 1 ? "page" : undefined}>{item}</li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
