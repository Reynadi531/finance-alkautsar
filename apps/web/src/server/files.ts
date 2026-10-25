import { storedFile } from "@keuangan-alkautsar/db/schema/finance";
import { eq } from "drizzle-orm";

import type { DbExecutor } from "@/server/audit";
import { db, storage } from "@/services";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const proofMimeTypes = ["image/jpeg", "image/png", "application/pdf"] as const;
export const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

/** Validates an uploaded file's type and size; throws a user-facing message when invalid. */
export function assertUpload(file: File, allowed: readonly string[]) {
  if (!allowed.includes(file.type)) {
    throw new Error("Format berkas tidak didukung.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Ukuran berkas melebihi 5 MB.");
  }
}

/**
 * Puts the file in object storage and records its metadata row. Pair with `assertUpload`
 * first. When `executor` is a transaction that later rolls back, the caller must remove
 * the returned `key` with `removeObjects`.
 */
export async function saveUpload(executor: DbExecutor, file: File) {
  const id = crypto.randomUUID();
  const key = `uploads/${id}`;
  await storage.put(key, new Uint8Array(await file.arrayBuffer()), file.type);
  try {
    await executor.insert(storedFile).values({
      id,
      key,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error) {
    await removeObjects(key);
    throw error;
  }
  return { id, key };
}

/**
 * Deletes a file's metadata row and returns its object key. Call `removeObjects` with the
 * key once the surrounding transaction commits.
 */
export async function deleteStoredFile(executor: Pick<typeof db, "delete">, id: string) {
  const [row] = await executor
    .delete(storedFile)
    .where(eq(storedFile.id, id))
    .returning({ key: storedFile.key });
  return row?.key;
}

/**
 * Best-effort removal of objects whose rows are already gone. A failure only leaves an
 * orphaned object behind, so it is logged rather than surfaced to the user.
 */
export async function removeObjects(...keys: (string | null | undefined)[]) {
  const present = keys.filter((key): key is string => Boolean(key));
  try {
    await storage.delete(...present);
  } catch (error) {
    console.error("Failed to remove stored objects", present, error);
  }
}

/** Signed-in users download stored files from this URL. */
export function fileUrl(fileId: string) {
  return `/api/files/${fileId}`;
}
