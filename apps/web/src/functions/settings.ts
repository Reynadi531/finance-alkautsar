import { storedFile } from "@keuangan-alkautsar/db/schema/finance";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

import { authMiddleware } from "@/middleware/auth";
import { adminOnly, requireRole } from "@/server/authz";
import { assertUpload, imageMimeTypes, saveUpload } from "@/server/files";
import { loadSettings, updateMosque, type MosqueSettings } from "@/server/settings";
import { db } from "@/services";

export type { MosqueSettings };

export const getMosqueSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MosqueSettings> => {
    requireRole(context.session, adminOnly);
    const { exists: _exists, ...settings } = await loadSettings(db);
    return settings;
  });

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));

export const mosqueProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama masjid wajib diisi.")
    .max(120, "Nama masjid maksimal 120 karakter."),
  address: optionalText(300, "Alamat maksimal 300 karakter."),
  phone: optionalText(30, "Nomor telepon maksimal 30 karakter.").refine(
    (value) => value === null || /^[0-9+()\-.\s]{5,30}$/.test(value),
    "Nomor telepon hanya boleh berisi angka, spasi, +, -, dan tanda kurung.",
  ),
});

export const saveMosqueProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(mosqueProfileSchema)
  .handler(async ({ context, data }) => {
    const actor = requireRole(context.session, adminOnly);
    return updateMosque(actor.id, "Mengubah pengaturan masjid", data);
  });

/** Replaces the sign-in page background. Expects FormData with a `file` entry. */
export const uploadLoginBackground = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: FormData) => data)
  .handler(async ({ context, data }) => {
    const actor = requireRole(context.session, adminOnly);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Pilih gambar terlebih dahulu.");
    }
    assertUpload(file, imageMimeTypes);

    const previousId = (await loadSettings(db)).loginBackground?.id;
    const fileId = await db.transaction(async (tx) => saveUpload(tx, file));
    try {
      return await updateMosque(
        actor.id,
        "Mengganti latar halaman masuk",
        { loginBackgroundFileId: fileId },
        async (tx) => {
          if (previousId) await tx.delete(storedFile).where(eq(storedFile.id, previousId));
        },
      );
    } catch (error) {
      await db.delete(storedFile).where(eq(storedFile.id, fileId));
      throw error;
    }
  });

export const removeLoginBackground = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const actor = requireRole(context.session, adminOnly);
    const previousId = (await loadSettings(db)).loginBackground?.id;
    if (!previousId) throw new Error("Belum ada gambar latar yang tersimpan.");
    return updateMosque(
      actor.id,
      "Menghapus latar halaman masuk",
      { loginBackgroundFileId: null },
      async (tx) => {
        await tx.delete(storedFile).where(eq(storedFile.id, previousId));
      },
    );
  });

export const setPublicReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ enabled: z.boolean() }))
  .handler(async ({ context, data }) => {
    const actor = requireRole(context.session, adminOnly);
    return updateMosque(
      actor.id,
      data.enabled ? "Mengaktifkan publikasi laporan" : "Menonaktifkan publikasi laporan",
      { publicReportEnabled: data.enabled },
    );
  });
