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

const selectClassName =
  "w-full justify-between rounded-lg border-control px-4 font-semibold text-ink data-[size=default]:h-12";

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
    <div role="search" className="flex flex-col gap-3">
      <SearchInput
        value={filters.q ?? ""}
        onSearch={(q) => onChange({ q: q.trim() || undefined })}
        placeholder="Cari aktivitas, pengguna, atau ID..."
        aria-label="Cari aktivitas, pengguna, atau ID"
        className="w-full"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
          className={cn(selectClassName, "sm:w-[212px]")}
        />
        <AppSelect
          variant="filter"
          aria-label="Aksi"
          value={filters.action ?? ALL}
          options={actionOptions}
          onValueChange={(value) =>
            onChange({ action: value === ALL ? undefined : (value as typeof filters.action) })
          }
          className={cn(selectClassName, "sm:w-[170px]")}
        />
        <AppSelect
          variant="filter"
          aria-label="Pengguna"
          value={filters.actor ?? ALL}
          options={actorOptions}
          onValueChange={(value) => onChange({ actor: value === ALL ? undefined : value })}
          className={cn(selectClassName, "sm:w-[198px]")}
        />
        <EntityFilter value={filters.entity} onChange={(entity) => onChange({ entity })} />
      </div>
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
          "flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-control bg-white px-4 text-[13px] font-semibold text-ink outline-none hover:bg-muted-surface focus-visible:ring-2 focus-visible:ring-primary-action/30 sm:w-[142px] sm:justify-start",
          value && "border-primary-action/40 bg-action text-action-foreground",
        )}
        aria-label={value ? `Filter jenis data: ${entityLabels[value]}` : "Filter jenis data"}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {value ? entityLabels[value] : "Filter"}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 gap-1 rounded-lg bg-white p-1.5 text-ink">
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
                  "flex items-center justify-between rounded-md px-2 py-2 text-left text-[13px] outline-none hover:bg-muted-surface focus-visible:ring-2 focus-visible:ring-primary-action/30",
                  selected && "bg-action font-semibold text-action-foreground",
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
