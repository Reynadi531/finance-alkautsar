import { ArrowRight, History, SearchX } from "lucide-react";
import type { ReactNode } from "react";

import { ActionButton } from "@/components/action-button";
import { Td, Th, Tr } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import type { ChangeLogEntry } from "@/functions/change-log";
import { auditActionLabel, auditActionTone } from "@/lib/audit-labels";
import { formatTimestamp } from "@/lib/date-range";

const COLUMNS = 6;

/** Audit list (newest first). `empty` is rendered in place of rows when there are none. */
export function ChangeLogTable({
  rows,
  onOpen,
  empty,
}: {
  rows: readonly ChangeLogEntry[];
  onOpen: (entry: ChangeLogEntry) => void;
  empty: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[9px] border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <caption className="sr-only">Riwayat perubahan data</caption>
          <thead>
            <tr>
              <Th className="w-[14%] rounded-none py-4 pl-4 first:rounded-none">Waktu</Th>
              <Th className="w-[16%] rounded-none py-4">Pengguna</Th>
              <Th className="w-[25%] rounded-none py-4">Aktivitas</Th>
              <Th className="w-[19%] rounded-none py-4">Data terkait</Th>
              <Th className="w-[13%] rounded-none py-4">Aksi</Th>
              <Th className="w-[13%] rounded-none py-4 pr-4 last:rounded-none">Detail</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS} className="border-t border-line px-4 py-12">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <Tr key={row.id} className="border-t border-b-0 border-line">
                  <Td className="py-[22px] pl-4 text-xs whitespace-nowrap text-ink-muted tabular-nums">
                    <time dateTime={new Date(row.createdAt).toISOString()}>
                      {formatTimestamp(row.createdAt)}
                    </time>
                  </Td>
                  <Td className="text-xs text-ink">{row.actorName ?? "Sistem"}</Td>
                  <Td className="text-xs font-semibold text-ink">{row.summary}</Td>
                  <Td className="text-xs text-ink">{row.entityLabel}</Td>
                  <Td>
                    <StatusBadge
                      tone={auditActionTone(row.entity, row.action)}
                      className="font-semibold"
                    >
                      {auditActionLabel(row.entity, row.action)}
                    </StatusBadge>
                  </Td>
                  <Td className="pr-4">
                    <button
                      type="button"
                      onClick={() => onOpen(row)}
                      className="inline-flex items-center gap-1 rounded text-xs whitespace-nowrap text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
                      aria-label={`Lihat detail: ${row.summary}, ${row.entityLabel}`}
                    >
                      Lihat detail
                      <ArrowRight className="size-3" aria-hidden />
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Empty body for the table: no history at all vs. nothing matching the filters. */
export function ChangeLogEmpty({
  variant,
  onReset,
}: {
  variant: "no-history" | "no-match";
  onReset?: () => void;
}) {
  const Icon = variant === "no-history" ? History : SearchX;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2.5 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-canvas text-ink-muted">
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <p className="font-display text-[15px] font-bold text-ink">
        {variant === "no-history"
          ? "Belum ada riwayat perubahan"
          : "Tidak ada aktivitas yang cocok"}
      </p>
      <p className="text-xs text-ink-muted">
        {variant === "no-history"
          ? "Perubahan pada transaksi, kategori, pengguna, dan pengaturan masjid akan tercatat di sini secara otomatis."
          : "Coba ubah kata kunci, periode, atau filter lain untuk melihat aktivitas lainnya."}
      </p>
      {variant === "no-match" && onReset ? (
        <ActionButton tone="outline" size="sm" onClick={onReset} className="mt-1">
          Atur ulang filter
        </ActionButton>
      ) : null}
    </div>
  );
}
