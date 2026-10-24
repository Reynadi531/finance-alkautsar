import { Button } from "@keuangan-alkautsar/ui/components/button";
import { Input } from "@keuangan-alkautsar/ui/components/input";
import { Label } from "@keuangan-alkautsar/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@keuangan-alkautsar/ui/components/popover";
import { ChevronDown, Clock3 } from "lucide-react";
import { useId, useState } from "react";

import { currentMonthRange, formatRange, type DateRange } from "@/lib/date-range";

const inputClassName =
  "h-10 rounded-lg border-field bg-white px-2.5 text-sm text-ink focus-visible:border-income focus-visible:ring-2 focus-visible:ring-income/20 aria-invalid:border-expense aria-invalid:ring-expense/20 md:text-sm";

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
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink-strong outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-income/30"
        aria-label={`Periode: ${formatRange(value)}. Ubah periode`}
      >
        <Clock3 className="size-3.5 text-ink-muted" aria-hidden />
        {formatRange(value)}
        <ChevronDown className="size-4 text-ink-muted" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] gap-4 rounded-xl bg-white p-4 text-ink"
      >
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            apply(draft);
          }}
        >
          <p className="text-[13px] font-bold">Pilih periode</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-from`} className="text-xs text-ink-body">
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
              <Label htmlFor={`${id}-to`} className="text-xs text-ink-body">
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
              className="h-9 rounded-lg px-3 text-[13px] text-action-foreground hover:bg-action"
              onClick={() => apply(currentMonthRange())}
            >
              Bulan ini
            </Button>
            <Button
              type="submit"
              className="h-9 rounded-lg bg-income px-4 text-[13px] font-bold text-white hover:bg-income/90"
            >
              Terapkan
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
