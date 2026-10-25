import { storedFile } from "@keuangan-alkautsar/db/schema/finance";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { auth, db, storage } from "@/services";

export const Route = createFileRoute("/api/files/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user.role) {
          return new Response("Unauthorized", { status: 401 });
        }
        const [file] = await db.select().from(storedFile).where(eq(storedFile.id, params.id));
        const object = file && (await storage.get(file.key));
        if (!object) {
          return new Response("Not found", { status: 404 });
        }
        const download = new URL(request.url).searchParams.has("download");
        return new Response(object.body, {
          headers: {
            "Content-Type": file.mimeType,
            "Content-Length": String(file.size),
            "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
            "Cache-Control": "private, max-age=300",
          },
        });
      },
    },
  },
});
