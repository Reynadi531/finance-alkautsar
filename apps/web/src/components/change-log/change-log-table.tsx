import { ArrowRight, History, SearchX } from "lucide-react";
import type { ReactNode } from "react";

import { ActionButton } from "@/components/action-button";
import { DataTable, Td, Th, Tr } from "@/components/data-table";
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
    <>
      <div className="hidden md:block">
        <DataTable className="min-w-[860px]">
          <caption className="sr-only">Riwayat perubahan data</caption>
          <thead>
            <tr>
              <Th className="w-[14%] py-4 pl-4">Waktu</Th>
              <Th className="w-[16%] py-4">Pengguna</Th>
              <Th className="w-[25%] py-4">Aktivitas</Th>
              <Th className="w-[19%] py-4">Data terkait</Th>
              <Th className="w-[13%] py-4">Aksi</Th>
              <Th className="w-[13%] py-4 pr-4">Detail</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS} className="px-4 py-12">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <Tr key={row.id}>
                  <Td className="py-[18px] pl-4 text-xs whitespace-nowrap text-ink tabular-nums">
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
                      className="inline-flex items-center gap-1 rounded text-xs font-semibold whitespace-nowrap text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-action/30"
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
        </DataTable>
      </div>

      <ul aria-label="Riwayat perubahan data" className="flex flex-col gap-3 md:hidden">
        {rows.length === 0 ? (
          <li className="py-8">{empty}</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="flex flex-col gap-4 rounded-lg bg-empty-surface p-[18px]">
              <p className="text-base leading-[26px] font-semibold text-ink">{row.summary}</p>
              <dl className="flex flex-col gap-4">
                <MobileField label="Waktu">
                  <time dateTime={new Date(row.createdAt).toISOString()}>
                    {formatTimestamp(row.createdAt)}
                  </time>
                </MobileField>
                <MobileField label="Pengguna">{row.actorName ?? "Sistem"}</MobileField>
                <MobileField label="Data terkait">{row.entityLabel}</MobileField>
                <MobileField label="Aksi">
                  <StatusBadge
                    tone={auditActionTone(row.entity, row.action)}
                    className="font-semibold"
                  >
                    {auditActionLabel(row.entity, row.action)}
                  </StatusBadge>
                </MobileField>
              </dl>
              <ActionButton
                tone="outline"
                onClick={() => onOpen(row)}
                aria-label={`Lihat detail: ${row.summary}, ${row.entityLabel}`}
                className="w-full"
              >
                Lihat detail
              </ActionButton>
            </li>
          ))
        )}
      </ul>
    </>
  );
}

function MobileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <dt className="text-[10px] text-ink-muted">{label}</dt>
      <dd className="text-[13px] text-ink">{children}</dd>
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
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
      <Icon className="size-8 text-ink-subtle" aria-hidden />
      <p className="font-display text-[17px] font-semibold text-ink">
        {variant === "no-history"
          ? "Belum ada riwayat perubahan"
          : "Tidak ada aktivitas yang cocok"}
      </p>
      <p className="text-xs leading-[22px] text-ink-muted">
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
