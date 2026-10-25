import { mosque, storedFile } from "@keuangan-alkautsar/db/schema/finance";
import { eq } from "drizzle-orm";

import { recordAudit, type AuditSnapshots } from "@/server/audit";
import { db } from "@/services";

const MOSQUE_ID = 1;
const FALLBACK_NAME = "Masjid";

type Executor = Pick<typeof db, "select">;

/** Current mosque profile (or defaults before the first save) with its login background. */
export async function loadSettings(executor: Executor) {
  const [row] = await executor
    .select({
      name: mosque.name,
      address: mosque.address,
      phone: mosque.phone,
      publicReportEnabled: mosque.publicReportEnabled,
      backgroundId: storedFile.id,
      backgroundName: storedFile.fileName,
      backgroundSize: storedFile.size,
    })
    .from(mosque)
    .leftJoin(storedFile, eq(storedFile.id, mosque.loginBackgroundFileId))
    .where(eq(mosque.id, MOSQUE_ID));

  return {
    exists: Boolean(row),
    name: row?.name ?? FALLBACK_NAME,
    address: row?.address ?? null,
    phone: row?.phone ?? null,
    publicReportEnabled: row?.publicReportEnabled ?? false,
    loginBackground: row?.backgroundId
      ? { id: row.backgroundId, fileName: row.backgroundName!, size: row.backgroundSize! }
      : null,
  };
}

export type Settings = Awaited<ReturnType<typeof loadSettings>>;
export type MosqueSettings = Omit<Settings, "exists">;

function snapshot(settings: Omit<Settings, "exists">): AuditSnapshots["mosque"] {
  return {
    name: settings.name,
    address: settings.address,
    phone: settings.phone,
    publicReportEnabled: settings.publicReportEnabled,
    loginBackgroundFileName: settings.loginBackground?.fileName ?? null,
  };
}

/**
 * Applies `changes` to the singleton mosque row (creating it if needed) and records one
 * audit entry, all in one transaction.
 */
export async function updateMosque(
  actorId: string,
  summary: string,
  changes: Partial<typeof mosque.$inferInsert>,
  extra?: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<void>,
) {
  return db.transaction(async (tx) => {
    const before = await loadSettings(tx);
    await tx
      .insert(mosque)
      .values({ id: MOSQUE_ID, name: before.name, ...changes })
      .onConflictDoUpdate({ target: mosque.id, set: changes });
    await extra?.(tx);
    const after = await loadSettings(tx);
    await recordAudit(tx, {
      actorId,
      action: before.exists ? "update" : "create",
      entity: "mosque",
      entityId: String(MOSQUE_ID),
      entityLabel: after.name,
      summary,
      before: before.exists ? snapshot(before) : null,
      after: snapshot(after),
    });
    const { exists: _exists, ...settings } = after;
    return settings;
  });
}
