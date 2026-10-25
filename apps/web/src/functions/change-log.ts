import { user } from "@keuangan-alkautsar/db/schema/auth";
import { auditLog } from "@keuangan-alkautsar/db/schema/finance";
import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, desc, eq, gte, ilike, isNull, max, or, type SQL } from "drizzle-orm";

import {
  CHANGE_LOG_PAGE_SIZE,
  DEFAULT_PERIOD,
  SYSTEM_ACTOR,
  changeLogSearchSchema,
  periodStart,
  type ChangeLogFilters,
} from "@/components/change-log/filters";
import {
  auditActionLabel,
  auditFieldChanges,
  entityLabels,
  type AuditAction,
  type AuditEntity,
} from "@/lib/audit-labels";
import { formatTimestamp } from "@/lib/date-range";
import { authMiddleware } from "@/middleware/auth";
import { financeStaff, requireRole } from "@/server/authz";
import { db } from "@/services";

const filtersSchema = changeLogSearchSchema.omit({ page: true });

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function filterConditions(filters: ChangeLogFilters) {
  const conditions: SQL[] = [];
  const since = periodStart(filters.period ?? DEFAULT_PERIOD);
  if (since) conditions.push(gte(auditLog.createdAt, since));
  if (filters.action) conditions.push(eq(auditLog.action, filters.action));
  if (filters.entity) conditions.push(eq(auditLog.entity, filters.entity));
  if (filters.actor) {
    conditions.push(
      filters.actor === SYSTEM_ACTOR
        ? isNull(auditLog.actorId)
        : eq(auditLog.actorId, filters.actor),
    );
  }
  if (filters.q) {
    const pattern = `%${escapeLike(filters.q)}%`;
    const search = or(
      ilike(auditLog.summary, pattern),
      ilike(auditLog.entityLabel, pattern),
      ilike(auditLog.entityId, pattern),
      ilike(user.name, pattern),
    );
    if (search) conditions.push(search);
  }
  return and(...conditions);
}

const rowColumns = {
  id: auditLog.id,
  action: auditLog.action,
  entity: auditLog.entity,
  entityId: auditLog.entityId,
  entityLabel: auditLog.entityLabel,
  summary: auditLog.summary,
  before: auditLog.before,
  after: auditLog.after,
  note: auditLog.note,
  createdAt: auditLog.createdAt,
  actorName: user.name,
  actorRole: user.role,
};

/** JSON shape of a stored snapshot (see `AuditSnapshots`). */
type Snapshot = Record<string, string | number | boolean | null>;

export type ChangeLogEntry = Awaited<ReturnType<typeof getChangeLog>>["rows"][number];

/** One page of history plus the summary cards and actor options (S08). */
export const getChangeLog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(changeLogSearchSchema)
  .handler(async ({ context, data }) => {
    requireRole(context.session, financeStaff);
    const where = filterConditions(data);
    const thirtyDays = periodStart("30d");
    const today = periodStart("today");

    const [matched, rows, recent, todayStats, anyEntry, actors, system] = await Promise.all([
      db
        .select({ total: count() })
        .from(auditLog)
        .leftJoin(user, eq(user.id, auditLog.actorId))
        .where(where),
      db
        .select(rowColumns)
        .from(auditLog)
        .leftJoin(user, eq(user.id, auditLog.actorId))
        .where(where)
        .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
        .limit(CHANGE_LOG_PAGE_SIZE)
        .offset(((data.page ?? 1) - 1) * CHANGE_LOG_PAGE_SIZE),
      db
        .select({ entity: auditLog.entity, total: count() })
        .from(auditLog)
        .where(thirtyDays ? gte(auditLog.createdAt, thirtyDays) : undefined)
        .groupBy(auditLog.entity),
      db
        .select({ total: count(), last: max(auditLog.createdAt) })
        .from(auditLog)
        .where(today ? gte(auditLog.createdAt, today) : undefined),
      db.select({ id: auditLog.id }).from(auditLog).limit(1),
      db
        .selectDistinct({ id: user.id, name: user.name })
        .from(auditLog)
        .innerJoin(user, eq(user.id, auditLog.actorId))
        .orderBy(asc(user.name)),
      db.select({ id: auditLog.id }).from(auditLog).where(isNull(auditLog.actorId)).limit(1),
    ]);

    const totalRecent = recent.reduce((sum, row) => sum + row.total, 0);
    const dataChanges = recent
      .filter((row) => row.entity === "transaction" || row.entity === "category")
      .reduce((sum, row) => sum + row.total, 0);

    return {
      rows: rows.map((row) => ({
        ...row,
        before: row.before as Snapshot | null,
        after: row.after as Snapshot | null,
      })),
      total: matched[0]?.total ?? 0,
      hasHistory: anyEntry.length > 0,
      actors: [...actors, ...(system.length > 0 ? [{ id: SYSTEM_ACTOR, name: "Sistem" }] : [])],
      stats: {
        totalRecent,
        dataChanges,
        today: todayStats[0]?.total ?? 0,
        lastToday: todayStats[0]?.last ?? null,
      },
    };
  });

const EXPORT_LIMIT = 10_000;

function csvCell(value: string) {
  // Quote every cell; neutralise spreadsheet formulas from user-entered text.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

/**
 * CSV of every entry matching the filters, newest first. Only safe columns: changed field
 * names are listed, values and snapshots are not.
 */
export const exportChangeLog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(filtersSchema)
  .handler(async ({ context, data }) => {
    requireRole(context.session, financeStaff);
    const rows = await db
      .select(rowColumns)
      .from(auditLog)
      .leftJoin(user, eq(user.id, auditLog.actorId))
      .where(filterConditions(data))
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(EXPORT_LIMIT);

    const header = [
      "Waktu (WIB)",
      "Pengguna",
      "Aksi",
      "Jenis data",
      "Aktivitas",
      "Data terkait",
      "ID data",
      "Kolom berubah",
      "Catatan",
    ];
    const lines = rows.map((row) => {
      const entity = row.entity as AuditEntity;
      const action = row.action as AuditAction;
      const changed =
        action === "update"
          ? auditFieldChanges(entity, action, row.before, row.after)
              .map((change) => change.label)
              .join(", ")
          : "";
      return [
        formatTimestamp(row.createdAt),
        row.actorName ?? "Sistem",
        auditActionLabel(entity, action),
        entityLabels[entity],
        row.summary,
        row.entityLabel,
        row.entityId,
        changed,
        row.note ?? "",
      ]
        .map(csvCell)
        .join(",");
    });
    return {
      csv: `﻿${[header.map(csvCell).join(","), ...lines].join("\r\n")}\r\n`,
      count: rows.length,
    };
  });
