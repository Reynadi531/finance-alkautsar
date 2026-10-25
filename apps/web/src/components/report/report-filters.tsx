import { Input } from "@keuangan-alkautsar/ui/components/input";
import { Label } from "@keuangan-alkautsar/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@keuangan-alkautsar/ui/components/popover";
import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { ChevronDown, Clock3 } from "lucide-react";
import { useId, useState } from "react";

import { ActionButton } from "@/components/action-button";
import { AppSelect } from "@/components/app-select";
import { fieldControlClassName } from "@/components/form-field";
import {
  invalidRangeMessage,
  reportKindLabels,
  reportKinds,
  type ReportKind,
} from "@/components/report/report-query";
import {
  endOfMonth,
  formatRange,
  formatTableDate,
  isFullMonth,
  startOfMonth,
  todayIso,
  type DateRange,
} from "@/lib/date-range";

const monthLabel = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Months from the first recorded transaction (or today) up to the latest one, newest first. */
function monthOptions(
  bounds: { firstDate: string | null; lastDate: string | null },
  range: DateRange,
) {
  const today = todayIso();
  const candidates = [today, range.from, range.to, bounds.firstDate, bounds.lastDate].filter(
    (value): value is string => Boolean(value),
  );
  const first = startOfMonth(candidates.reduce((a, b) => (a < b ? a : b)));
  const last = startOfMonth(candidates.reduce((a, b) => (a > b ? a : b)));
  const options: { value: string; label: string }[] = [];
  for (let month = last; month >= first; month = startOfMonth(month, -1)) {
    options.push({
      value: month.slice(0, 7),
      label: monthLabel.format(new Date(`${month}T00:00:00Z`)),
    });
  }
  return options;
}

const pillClassName =
  "flex h-[38px] items-center gap-2 rounded-lg border border-line bg-white px-3.5 text-[13px] font-bold text-ink-strong outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand/30";

/** Month picker: selecting a month sets the range to that full calendar month. */
export function MonthFilter({
  range,
  bounds,
  onChange,
}: {
  range: DateRange;
  bounds: { firstDate: string | null; lastDate: string | null };
  onChange: (range: DateRange) => void;
}) {
  return (
    <AppSelect
      variant="filter"
      aria-label="Bulan laporan"
      placeholder="Pilih bulan"
      value={isFullMonth(range) ? range.from.slice(0, 7) : null}
      options={monthOptions(bounds, range)}
      onValueChange={(month) => {
        const from = `${month}-01`;
        onChange({ from, to: endOfMonth(from) });
      }}
      className="text-ink-strong"
    />
  );
}

/** "Pilih tanggal" popover for an inclusive custom range; rejects an end date before the start. */
export function CustomRangeFilter({
  range,
  onChange,
}: {
  range: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);
  const [error, setError] = useState<string | null>(null);
  const custom = !isFullMonth(range);

  function apply() {
    if (!draft.from || !draft.to) {
      setError("Isi tanggal mulai dan tanggal akhir.");
      return;
    }
    if (draft.to < draft.from) {
      setError(invalidRangeMessage);
      return;
    }
    setError(null);
    setOpen(false);
    onChange(draft);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(range);
          setError(null);
        }
      }}
    >
      <PopoverTrigger
        className={cn(pillClassName, custom && "border-brand/40 text-brand")}
        aria-label={
          custom ? `Rentang tanggal: ${formatRange(range)}. Ubah rentang` : "Pilih rentang tanggal"
        }
      >
        <Clock3 className="size-3.5" aria-hidden />
        {custom ? formatRange(range) : "Pilih tanggal"}
        <ChevronDown className="size-4 text-ink-muted" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))] gap-4 rounded-xl bg-white p-4 text-ink"
      >
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
        >
          <p className="text-[13px] font-bold">Rentang tanggal laporan</p>
          <div className="grid grid-cols-2 gap-3">
            {(["from", "to"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-${key}`} className="text-xs font-bold text-ink-muted">
                  {key === "from" ? "Dari tanggal" : "Sampai tanggal"}
                </Label>
                <Input
                  id={`${id}-${key}`}
                  type="date"
                  value={draft[key]}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className={cn(fieldControlClassName, "h-10 px-2.5 text-[13px]")}
                />
              </div>
            ))}
          </div>
          {error ? (
            <p id={`${id}-error`} role="alert" className="text-xs text-expense">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <ActionButton type="submit" size="sm">
              Terapkan
            </ActionButton>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

const kindOptions = reportKinds.map((kind) => ({ value: kind, label: reportKindLabels[kind] }));

/** Transaction kind filter: Semua transaksi / Pemasukan / Pengeluaran. */
export function KindFilter({
  value,
  onChange,
}: {
  value: ReportKind;
  onChange: (kind: ReportKind) => void;
}) {
  return (
    <AppSelect
      variant="filter"
      aria-label="Jenis transaksi"
      value={value}
      options={kindOptions}
      onValueChange={(next) => onChange(next as ReportKind)}
      className="text-ink-strong"
    />
  );
}

/** "● Data diperbarui 31 Okt 2026" from the latest ledger change. */
export function UpdatedStamp({ updatedAt }: { updatedAt: string | null }) {
  return (
    <p className="flex items-center gap-2 text-xs font-medium text-link">
      <span aria-hidden className="size-2 rounded-full bg-current" />
      {updatedAt
        ? `Data diperbarui ${formatTableDate(todayIso(new Date(updatedAt)))}`
        : "Belum ada transaksi tercatat"}
    </p>
  );
}
