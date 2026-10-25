import { storedFile } from "@keuangan-alkautsar/db/schema/finance";

import type { DbExecutor } from "@/server/audit";

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

/** Stores an uploaded file and returns its id. Pair with `assertUpload` first. */
export async function saveUpload(executor: DbExecutor, file: File) {
  const [row] = await executor
    .insert(storedFile)
    .values({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      data: Buffer.from(await file.arrayBuffer()),
    })
    .returning({ id: storedFile.id });
  return row.id;
}

/** Signed-in users download stored files from this URL. */
export function fileUrl(fileId: string) {
  return `/api/files/${fileId}`;
}
