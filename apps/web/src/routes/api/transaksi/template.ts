import { createFileRoute } from "@tanstack/react-router";

import { toCsv } from "@/components/transactions/csv";
import { kindCopy } from "@/components/transactions/model";

const examples = {
  income: [
    ["tanggal", "kode_tipe", "jumlah", "metode", "keterangan"],
    ["2026-10-31", "PM-002", "2.450.000", "Transfer", "Kotak infaq pekan keempat"],
    ["30/10/2026", "Donasi", "1000000", "Tunai", "Donasi keluarga H. Umar"],
  ],
  expense: [
    ["tanggal", "kode_tipe", "jumlah", "metode", "penerima", "keterangan"],
    ["2026-10-30", "PK-004", "875.000", "Transfer", "PLN dan PDAM", "Listrik dan air Oktober"],
    ["29/10/2026", "Kebersihan", "250000", "Tunai", "", "Alat kebersihan"],
  ],
};

/** GET /api/transaksi/template?kind=income — example CSV for the import dialog. */
export const Route = createFileRoute("/api/transaksi/template")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const kind =
          new URL(request.url).searchParams.get("kind") === "expense" ? "expense" : "income";
        return new Response(toCsv(examples[kind]), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="templat-impor-${kindCopy[kind].noun}.csv"`,
          },
        });
      },
    },
  },
});
