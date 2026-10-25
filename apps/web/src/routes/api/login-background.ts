import { mosque, storedFile } from "@keuangan-alkautsar/db/schema/finance";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { db } from "@/services";

/**
 * Public sign-in page background configured in S09. No session required, since visitors
 * see it before signing in; returns 404 when no image is set.
 */
export const Route = createFileRoute("/api/login-background")({
  server: {
    handlers: {
      GET: async () => {
        const [file] = await db
          .select({
            data: storedFile.data,
            mimeType: storedFile.mimeType,
            size: storedFile.size,
          })
          .from(mosque)
          .innerJoin(storedFile, eq(storedFile.id, mosque.loginBackgroundFileId))
          .where(eq(mosque.id, 1));
        if (!file) {
          return new Response("Not found", {
            status: 404,
            headers: { "Cache-Control": "no-cache" },
          });
        }
        return new Response(new Uint8Array(file.data), {
          headers: {
            "Content-Type": file.mimeType,
            "Content-Length": String(file.size),
            "X-Content-Type-Options": "nosniff",
            // Revalidate so a replaced background shows up right away.
            "Cache-Control": "public, no-cache",
          },
        });
      },
    },
  },
});
