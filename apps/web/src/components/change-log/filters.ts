import z from "zod";

import { auditActions, auditEntities } from "@/lib/audit-labels";
import { addDays, todayIso } from "@/lib/date-range";
import { pageParam } from "@/lib/pagination";

export const CHANGE_LOG_PAGE_SIZE = 6;

export const periods = ["today", "7d", "30d", "90d", "all"] as const;
export type Period = (typeof periods)[number];
export const DEFAULT_PERIOD: Period = "30d";

export const periodLabels: Record<Period, string> = {
  today: "Hari ini",
  "7d": "7 hari terakhir",
  "30d": "30 hari terakhir",
  "90d": "90 hari terakhir",
  all: "Semua waktu",
};

/** Actor filter value for entries without a user (system changes). */
export const SYSTEM_ACTOR = "system";

/** URL search params of the change log; invalid values fall back to the defaults. */
export const changeLogSearchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  period: z.enum(periods).optional().catch(undefined),
  action: z.enum(auditActions).optional().catch(undefined),
  entity: z.enum(auditEntities).optional().catch(undefined),
  actor: z.string().min(1).max(64).optional().catch(undefined),
  page: pageParam,
});

export type ChangeLogSearch = z.infer<typeof changeLogSearchSchema>;
export type ChangeLogFilters = Omit<ChangeLogSearch, "page">;

/** Start of the period as an instant (midnight WIB), or null for "Semua waktu". */
export function periodStart(period: Period, now = new Date()): Date | null {
  const days = { today: 0, "7d": 6, "30d": 29, "90d": 89, all: null }[period];
  if (days === null) return null;
  return new Date(`${addDays(todayIso(now), -days)}T00:00:00+07:00`);
}

/** Number of filters that differ from the default view. */
export function activeFilterCount(filters: ChangeLogFilters) {
  return [
    filters.q,
    filters.period && filters.period !== DEFAULT_PERIOD ? filters.period : undefined,
    filters.action,
    filters.entity,
    filters.actor,
  ].filter(Boolean).length;
}
