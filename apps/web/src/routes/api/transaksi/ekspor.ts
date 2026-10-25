import { createFileRoute } from "@tanstack/react-router";

import { toCsv } from "@/components/transactions/csv";
import { kindCopy, monthParamSchema } from "@/components/transactions/model";
import { selectTransactions, transactionFilters, withRef } from "@/server/transactions";
import { auth } from "@/services";

/** GET /api/transaksi/ekspor?kind=income&month=2026-10&q=infaq — CSV of the list's current filters. */
export const Route = createFileRoute("/api/transaksi/ekspor")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        const role = session?.user.role;
        if (role !== "admin" && role !== "treasurer") {
          return new Response("Unauthorized", { status: 401 });
        }
        const params = new URL(request.url).searchParams;
        const kind = params.get("kind");
        const month = monthParamSchema.safeParse(params.get("month") ?? "all");
        if ((kind !== "income" && kind !== "expense") || !month.success) {
          return new Response("Parameter tidak valid", { status: 400 });
        }
        const q = (params.get("q") ?? "").slice(0, 100);

        const rows = (await selectTransactions(transactionFilters(kind, month.data, q))).map(
          withRef,
        );
        const isExpense = kind === "expense";
        const header = [
          "Referensi",
          "Tanggal",
          "Kode tipe",
          "Tipe",
          "Jumlah (Rp)",
          "Metode pembayaran",
          ...(isExpense ? ["Penerima"] : []),
          "Keterangan",
          "Bukti",
        ];
        const body = rows.map((row) => [
          row.ref,
          row.effectiveDate,
          row.categoryCode,
          row.categoryName,
          row.amount,
          row.paymentMethod,
          ...(isExpense ? [row.recipient] : []),
          row.description,
          row.proofFileName,
        ]);
        const fileName = `${kindCopy[kind].noun}-${month.data === "all" ? "semua" : month.data}.csv`;
        return new Response(toCsv([header, ...body]), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
