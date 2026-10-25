import { CircleDot, X } from "lucide-react";

import {
  DEFAULT_PERIOD,
  periodLabels,
  type ChangeLogFilters,
} from "@/components/change-log/filters";
import { actionLabels, entityLabels } from "@/lib/audit-labels";

const number = new Intl.NumberFormat("id-ID");

/** "5 perubahan · Diperbarui · Transaksi oleh Nadia Fitriani · 7 hari terakhir · “infaq”" */
function describeFilters(filters: ChangeLogFilters, total: number, actorName: string | null) {
  const parts = [`${number.format(total)} perubahan`];
  if (filters.action) parts.push(actionLabels[filters.action]);
  if (filters.entity) parts.push(entityLabels[filters.entity]);
  let sentence = parts.join(" · ");
  if (actorName) sentence += ` oleh ${actorName}`;
  const period = filters.period ?? DEFAULT_PERIOD;
  sentence += ` · ${periodLabels[period]}`;
  if (filters.q) sentence += ` · “${filters.q}”`;
  return sentence;
}

/** Tinted strip shown while any filter differs from the default view (ILpIP). */
export function ActiveFilterBanner({
  filters,
  total,
  actorName,
  onReset,
}: {
  filters: ChangeLogFilters;
  total: number;
  actorName: string | null;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[7px] bg-info-surface px-[15px] py-3.5 text-brand sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2.5 text-xs font-semibold" aria-live="polite">
        <CircleDot className="mt-px size-3.5 shrink-0" aria-hidden />
        <span>Filter aktif · {describeFilters(filters, total, actorName)}</span>
      </p>
      <button
        type="button"
        onClick={onReset}
        className="flex shrink-0 items-center gap-1.5 self-start rounded text-[11px] font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30 sm:self-auto"
      >
        Atur ulang filter
        <X className="size-3" aria-hidden />
      </button>
    </div>
  );
}
