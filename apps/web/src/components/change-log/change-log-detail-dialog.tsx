import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { AppDialog } from "@/components/app-dialog";
import { roleLabels } from "@/components/app-shell/navigation";
import { StatusBadge } from "@/components/status-badge";
import type { ChangeLogEntry } from "@/functions/change-log";
import {
  auditActionLabel,
  auditActionTone,
  auditDetailTitle,
  auditDomainLabel,
  auditEntityTypeLabel,
  auditFieldChanges,
  splitEntityLabel,
  type FieldChange,
} from "@/lib/audit-labels";

const longTimestamp = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/** "18 Agustus 2026, 14.32 WIB" */
function formatLongTimestamp(value: Date | string) {
  const parts = longTimestamp.formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}.${get("minute")} WIB`;
}

/** Read-only "Rincian perubahan" dialog for one audit entry (WmUo0). */
export function ChangeLogDetailDialog({
  entry,
  open,
  onOpenChange,
}: {
  /** Kept after closing so the dialog content stays put during the exit animation. */
  entry: ChangeLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AppDialog
      open={open && entry !== null}
      onOpenChange={onOpenChange}
      eyebrow="Rincian perubahan"
      title={entry ? auditDetailTitle(entry.entity, entry.action, entry.before, entry.after) : ""}
      description={entry ? <DetailSubtitle entry={entry} /> : null}
      className="sm:max-w-[580px]"
    >
      {entry ? <DetailBody entry={entry} /> : null}
    </AppDialog>
  );
}

function DetailSubtitle({ entry }: { entry: ChangeLogEntry }) {
  const { reference } = splitEntityLabel(entry.entityLabel);
  const type = auditEntityTypeLabel(entry.entity, entry.before, entry.after);
  return (
    <span className="text-xs text-ink-muted">{reference ? `${reference}  ·  ${type}` : type}</span>
  );
}

function DetailBody({ entry }: { entry: ChangeLogEntry }) {
  const { name } = splitEntityLabel(entry.entityLabel);
  const changes = auditFieldChanges(entry.entity, entry.action, entry.before, entry.after);
  const actor = entry.actorName
    ? `${entry.actorName}${entry.actorRole ? ` · ${roleLabels[entry.actorRole as keyof typeof roleLabels]}` : ""}`
    : "Sistem";
  const transactionLink = relatedTransactionLink(entry);

  return (
    <div className="-mt-1 flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone={auditActionTone(entry.entity, entry.action)} className="px-2.5 py-1.5">
          {auditActionLabel(entry.entity, entry.action)}
        </StatusBadge>
        <StatusBadge tone="neutral" className="px-2.5 py-1.5">
          {auditDomainLabel(entry.entity)}
        </StatusBadge>
      </div>

      <dl className="flex flex-col gap-3 text-[11px]">
        <MetaRow label="Dilakukan oleh">{actor}</MetaRow>
        <MetaRow label="Waktu">
          <time dateTime={new Date(entry.createdAt).toISOString()}>
            {formatLongTimestamp(entry.createdAt)}
          </time>
        </MetaRow>
        <MetaRow label="Data terkait">{name}</MetaRow>
      </dl>

      <section aria-labelledby="change-values-title" className="flex flex-col gap-3">
        <h3 id="change-values-title" className="text-xs font-bold text-ink">
          Perubahan nilai
        </h3>
        <ValueChanges entry={entry} changes={changes} />
      </section>

      {entry.note ? (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[10px] font-bold tracking-[0.06em] text-ink-muted uppercase">
            Catatan
          </h3>
          <p className="text-xs leading-relaxed text-ink">{entry.note}</p>
        </section>
      ) : null}

      {transactionLink ? (
        <>
          <div className="h-px bg-line" />
          <Link
            to={transactionLink.to}
            search={{ q: transactionLink.q } as never}
            className="inline-flex items-center gap-1.5 self-start rounded text-xs font-bold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            Lihat transaksi terkait
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </>
      ) : null}
    </div>
  );
}

function relatedTransactionLink(entry: ChangeLogEntry) {
  if (entry.entity !== "transaction" || entry.action === "delete") return null;
  const kind = (entry.after ?? entry.before)?.kind;
  const { reference } = splitEntityLabel(entry.entityLabel);
  if ((kind !== "income" && kind !== "expense") || !reference) return null;
  return {
    to: kind === "income" ? "/dashboard/transaksi/masuk" : "/dashboard/transaksi/keluar",
    q: reference,
  } as const;
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-right font-bold break-words text-ink">{children}</dd>
    </div>
  );
}

function ValueChanges({ entry, changes }: { entry: ChangeLogEntry; changes: FieldChange[] }) {
  if (changes.length === 0) {
    return <p className="text-xs text-ink-muted">Tidak ada perubahan nilai yang tercatat.</p>;
  }

  // Creates and deletes: one box listing the whole record.
  if (entry.action === "create" || entry.action === "delete" || !entry.before || !entry.after) {
    const side = changes.some((change) => change.after !== null) ? "after" : "before";
    return (
      <ValueBox side={side}>
        <dl className="flex flex-col gap-2.5">
          {changes.map((change) => (
            <div key={change.key} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
              <dt className="shrink-0 text-[11px] opacity-80 sm:w-36">{change.label}</dt>
              <dd
                className={cn(
                  "min-w-0 text-[13px] font-semibold break-words",
                  change.amount && "font-display text-[15px] font-bold",
                )}
              >
                {side === "after" ? change.after : change.before}
              </dd>
            </div>
          ))}
        </dl>
      </ValueBox>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {changes.map((change) => (
        <div key={change.key} className="flex flex-col gap-2">
          {changes.length > 1 || !change.amount ? (
            <p className="text-[11px] font-semibold text-ink-body">{change.label}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-2.5">
            <ValueBox side="before">
              <FieldValue change={change} value={change.before} />
            </ValueBox>
            <ValueBox side="after">
              <FieldValue change={change} value={change.after} />
            </ValueBox>
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldValue({ change, value }: { change: FieldChange; value: string | null }) {
  if (value === null) {
    return <p className="text-[13px] italic opacity-80">Kosong</p>;
  }
  return (
    <p
      className={cn(
        "break-words",
        change.amount
          ? "font-display text-[17px] font-bold tabular-nums"
          : "text-[13px] font-semibold",
      )}
    >
      {value}
    </p>
  );
}

function ValueBox({ side, children }: { side: "before" | "after"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-[7px] rounded-[7px] p-3.5",
        side === "before" ? "bg-canvas text-ink-muted" : "bg-income-surface text-income",
      )}
    >
      <p className="text-[10px] font-bold tracking-[0.06em] uppercase">
        {side === "before" ? "Sebelum" : "Sesudah"}
      </p>
      {children}
    </div>
  );
}
