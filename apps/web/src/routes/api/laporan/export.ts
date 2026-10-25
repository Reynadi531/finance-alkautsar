import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

import {
  reportFileName,
  reportFormats,
  reportKindLabels,
  reportQuerySchema,
} from "@/components/report/report-query";
import { formatRange } from "@/lib/date-range";
import { recordAudit } from "@/server/audit";
import { financeStaff } from "@/server/authz";
import { buildCashReport } from "@/server/report";
import { renderCashReport, reportMimeTypes } from "@/server/report-export";
import { auth, db } from "@/services";

const exportSchema = reportQuerySchema.and(
  z.object({
    format: z.enum(reportFormats, { error: "Format berkas harus xlsx atau pdf." }),
    running: z.enum(["1", "0"], { error: "Opsi saldo berjalan tidak valid." }).default("1"),
  }),
);

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * GET /api/laporan/export?format=xlsx|pdf&from=YYYY-MM-DD&to=YYYY-MM-DD&kind=all|income|expense&running=1|0
 * Builds the S06 cash report file from the same ledger computation as the screen and records
 * an audit entry. Admin and treasurer only.
 */
export const Route = createFileRoute("/api/laporan/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return textResponse("Sesi berakhir. Silakan masuk kembali.", 401);
        }
        const role = session.user.role;
        if (!role || !(financeStaff as readonly string[]).includes(role)) {
          return textResponse("Anda tidak memiliki akses untuk mengekspor laporan kas.", 403);
        }

        const params = Object.fromEntries(new URL(request.url).searchParams);
        const parsed = exportSchema.safeParse(params);
        if (!parsed.success) {
          const message = parsed.error.issues[0]?.message ?? "Parameter ekspor tidak valid.";
          return textResponse(message, 400);
        }
        const { format, running, ...query } = parsed.data;

        const report = await buildCashReport(query);
        const file = await renderCashReport(report, format, {
          running: running === "1",
          exportedBy: session.user.name,
          exportedAt: new Date(),
        });
        const fileName = reportFileName(report.mosqueName, query, format);

        await recordAudit(db, {
          actorId: session.user.id,
          action: "create",
          entity: "report",
          entityId: crypto.randomUUID(),
          entityLabel: `Laporan kas · ${formatRange(query)}`,
          summary: "Mengekspor laporan kas",
          after: { format, from: query.from, to: query.to, scope: reportKindLabels[query.kind] },
          note: `${fileName} · ${report.rows.length} transaksi${running === "1" ? "" : " · tanpa saldo berjalan"}`,
        });

        return new Response(file, {
          headers: {
            "Content-Type": reportMimeTypes[format],
            "Content-Length": String(file.byteLength),
            "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
            "X-Report-Rows": String(report.rows.length),
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
