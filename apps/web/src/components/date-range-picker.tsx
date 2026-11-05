import { Button } from "@keuangan-alkautsar/ui/components/button";
import { Input } from "@keuangan-alkautsar/ui/components/input";
import { Label } from "@keuangan-alkautsar/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@keuangan-alkautsar/ui/components/popover";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { currentMonthRange, formatRange, type DateRange } from "@/lib/date-range";

const inputClassName =
  "h-10 rounded-lg border-field bg-white px-2.5 text-sm text-ink focus-visible:border-ink-strong focus-visible:ring-2 focus-visible:ring-ink-strong/20 aria-invalid:border-expense aria-invalid:ring-expense/20 md:text-sm";

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  function apply(range: DateRange) {
    if (!range.from || !range.to) {
      setError("Isi tanggal mulai dan tanggal akhir.");
      return;
    }
    if (range.to < range.from) {
      setError("Tanggal akhir tidak boleh sebelum tanggal mulai.");
      return;
    }
    setError(null);
    setOpen(false);
    onChange(range);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(value);
          setError(null);
        }
      }}
    >
      <PopoverTrigger
        className="flex h-12 w-full items-center justify-between gap-2.5 rounded-lg border border-control bg-white px-3.5 text-xs font-medium whitespace-nowrap text-ink outline-none hover:bg-muted-surface focus-visible:ring-2 focus-visible:ring-primary-action/30 sm:w-auto sm:justify-start"
        aria-label={`Periode: ${formatRange(value)}. Ubah periode`}
      >
        <span className="flex items-center gap-2.5">
          <CalendarDays className="size-4 shrink-0 text-ink-strong" aria-hidden />
          {formatRange(value)}
        </span>
        <ChevronDown className="size-4 shrink-0 text-ink-strong" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] gap-4 rounded-[10px] bg-white p-4 text-ink"
      >
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            apply(draft);
          }}
        >
          <p className="text-[13px] font-semibold">Pilih periode</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-from`} className="text-xs font-semibold text-ink">
                Dari
              </Label>
              <Input
                id={`${id}-from`}
                type="date"
                value={draft.from}
                max={draft.to || undefined}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={inputClassName}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-to`} className="text-xs font-semibold text-ink">
                Sampai
              </Label>
              <Input
                id={`${id}-to`}
                type="date"
                value={draft.to}
                min={draft.from || undefined}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={inputClassName}
              />
            </div>
          </div>
          {error ? (
            <p id={`${id}-error`} role="alert" className="text-xs text-expense">
              {error}
            </p>
          ) : null}
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg px-3 text-[13px] font-semibold text-action-foreground hover:bg-action"
              onClick={() => apply(currentMonthRange())}
            >
              Bulan ini
            </Button>
            <Button
              type="submit"
              className="h-9 rounded-lg bg-primary-action px-4 text-[13px] font-semibold text-white hover:bg-primary-action-hover"
            >
              Terapkan
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
