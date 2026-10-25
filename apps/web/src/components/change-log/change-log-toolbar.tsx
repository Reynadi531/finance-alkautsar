import { Popover, PopoverContent, PopoverTrigger } from "@keuangan-alkautsar/ui/components/popover";
import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Check, SlidersHorizontal } from "lucide-react";

import { AppSelect } from "@/components/app-select";
import {
  DEFAULT_PERIOD,
  periodLabels,
  periods,
  type ChangeLogFilters,
} from "@/components/change-log/filters";
import { SearchInput } from "@/components/search-input";
import { actionLabels, auditActions, auditEntities, entityLabels } from "@/lib/audit-labels";

const ALL = "all";

const periodOptions = periods.map((value) => ({ value, label: periodLabels[value] }));
const actionOptions = [
  { value: ALL, label: "Semua aksi" },
  ...auditActions.map((value) => ({ value, label: actionLabels[value] })),
];

export type FilterPatch = Partial<ChangeLogFilters>;

/** Search, period, action, user, and the "Filter" popover (data type) for S08. */
export function ChangeLogToolbar({
  filters,
  actors,
  onChange,
}: {
  filters: ChangeLogFilters;
  actors: readonly { id: string; name: string }[];
  onChange: (patch: FilterPatch) => void;
}) {
  const actorOptions = [
    { value: ALL, label: "Semua pengguna" },
    ...actors.map((actor) => ({ value: actor.id, label: actor.name })),
  ];
  // Keep a filtered actor selectable even when they have no entries in view.
  if (filters.actor && !actors.some((actor) => actor.id === filters.actor)) {
    actorOptions.push({ value: filters.actor, label: "Pengguna lain" });
  }

  return (
    <div role="search" className="flex flex-wrap items-center gap-2.5">
      <SearchInput
        value={filters.q ?? ""}
        onSearch={(q) => onChange({ q: q.trim() || undefined })}
        placeholder="Cari aktivitas, pengguna, atau ID..."
        aria-label="Cari aktivitas, pengguna, atau ID"
        className="w-full sm:w-[350px]"
      />
      <AppSelect
        variant="filter"
        aria-label="Periode"
        value={filters.period ?? DEFAULT_PERIOD}
        options={periodOptions}
        onValueChange={(value) =>
          onChange({
            period: value === DEFAULT_PERIOD ? undefined : (value as typeof filters.period),
          })
        }
        className="min-w-[160px] justify-between font-normal"
      />
      <AppSelect
        variant="filter"
        aria-label="Aksi"
        value={filters.action ?? ALL}
        options={actionOptions}
        onValueChange={(value) =>
          onChange({ action: value === ALL ? undefined : (value as typeof filters.action) })
        }
        className="min-w-[137px] justify-between font-normal"
      />
      <AppSelect
        variant="filter"
        aria-label="Pengguna"
        value={filters.actor ?? ALL}
        options={actorOptions}
        onValueChange={(value) => onChange({ actor: value === ALL ? undefined : value })}
        className="min-w-[165px] justify-between font-normal"
      />
      <EntityFilter value={filters.entity} onChange={(entity) => onChange({ entity })} />
    </div>
  );
}

function EntityFilter({
  value,
  onChange,
}: {
  value: ChangeLogFilters["entity"];
  onChange: (entity: ChangeLogFilters["entity"]) => void;
}) {
  const choices = [undefined, ...auditEntities] as const;
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-[38px] items-center gap-2 rounded-lg border border-line bg-white px-3.5 text-xs font-semibold text-ink outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand/30",
          value && "border-brand/40 bg-info-surface text-brand",
        )}
        aria-label={value ? `Filter jenis data: ${entityLabels[value]}` : "Filter jenis data"}
      >
        <SlidersHorizontal className="size-3.5" aria-hidden />
        {value ? entityLabels[value] : "Filter"}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 gap-1 rounded-xl bg-white p-2 text-ink">
        <p
          id="change-log-entity-label"
          className="px-2 pt-1 pb-1.5 text-[10px] font-bold tracking-[0.08em] text-ink-label uppercase"
        >
          Jenis data
        </p>
        <div role="radiogroup" aria-labelledby="change-log-entity-label" className="flex flex-col">
          {choices.map((choice) => {
            const selected = choice === value;
            return (
              <button
                key={choice ?? ALL}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(choice)}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-2 text-left text-[13px] outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand/30",
                  selected && "font-semibold text-brand",
                )}
              >
                {choice ? entityLabels[choice] : "Semua jenis data"}
                {selected ? <Check className="size-3.5" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
