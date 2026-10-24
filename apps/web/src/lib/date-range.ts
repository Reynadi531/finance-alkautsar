import z from "zod";

// Transaction dates are calendar dates (YYYY-MM-DD) without a time component.
// "Today" is resolved in the mosque's local timezone until the PRD settles a per-mosque policy.
const APP_TIME_ZONE = "Asia/Jakarta";

export const isoDateSchema = z.iso.date();

export type DateRange = { from: string; to: string };

export function todayIso(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(now);
}

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

export function startOfMonth(iso: string, monthOffset = 0) {
  const date = parseIso(iso);
  return toIso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthOffset, 1)));
}

export function endOfMonth(iso: string) {
  const date = parseIso(iso);
  return toIso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));
}

export function currentMonthRange(now = new Date()): DateRange {
  const today = todayIso(now);
  return { from: startOfMonth(today), to: endOfMonth(today) };
}

export function daysInRange({ from, to }: DateRange) {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86_400_000) + 1;
}

export function isFullMonth({ from, to }: DateRange) {
  return from === startOfMonth(from) && to === endOfMonth(from);
}

/** The period of equal length that ends the day before `range` starts. */
export function previousRange(range: DateRange): DateRange {
  if (isFullMonth(range)) {
    const from = startOfMonth(range.from, -1);
    return { from, to: endOfMonth(from) };
  }
  const to = addDays(range.from, -1);
  return { from: addDays(to, -(daysInRange(range) - 1)), to };
}

const dayMonthYear = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dayMonthShort = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const monthShort = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" });

/** "1–31 Oktober 2026", "28 September – 3 Oktober 2026", or full dates across years. */
export function formatRange({ from, to }: DateRange) {
  const start = parseIso(from);
  const end = parseIso(to);
  if (from === to) return dayMonthYear.format(start);
  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return `${dayMonthYear.format(start)} – ${dayMonthYear.format(end)}`;
  }
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.getUTCDate()}–${dayMonthYear.format(end)}`;
  }
  const startLabel = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(start);
  return `${startLabel} – ${dayMonthYear.format(end)}`;
}

export function formatShortDate(iso: string) {
  return dayMonthShort.format(parseIso(iso)).replace(".", "");
}

export function formatMonthShort(iso: string) {
  return monthShort.format(parseIso(iso)).replace(".", "");
}

/** "Jun–Okt 2026", or "Nov 2025 – Mar 2026" across years. */
export function formatMonthSpan(fromIso: string, toIso: string) {
  const fromYear = parseIso(fromIso).getUTCFullYear();
  const toYear = parseIso(toIso).getUTCFullYear();
  if (fromYear === toYear) {
    return `${formatMonthShort(fromIso)}–${formatMonthShort(toIso)} ${toYear}`;
  }
  return `${formatMonthShort(fromIso)} ${fromYear} – ${formatMonthShort(toIso)} ${toYear}`;
}
