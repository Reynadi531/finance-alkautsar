import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@keuangan-alkautsar/ui/components/select";
import { cn } from "@keuangan-alkautsar/ui/lib/utils";

import { fieldControlClassName } from "@/components/form-field";

export type SelectOption = { value: string; label: string };

/**
 * Single-value select. `variant="field"` matches form inputs; `variant="filter"` is the
 * compact pill used in list toolbars ("Semua status ⌄").
 */
export function AppSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  variant = "field",
  disabled,
  className,
  "aria-label": ariaLabel,
  ...rest
}: {
  id?: string;
  value: string | null;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  variant?: "field" | "filter";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <Select
      value={value ?? null}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange(next);
      }}
      disabled={disabled}
      items={options}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        {...rest}
        className={cn(
          variant === "field"
            ? cn(
                fieldControlClassName,
                "flex items-center justify-between gap-2 data-[size=default]:h-[42px] data-placeholder:text-ink-subtle/80",
              )
            : "flex h-[38px] items-center data-[size=default]:h-[38px] gap-2 rounded-lg border border-line bg-white px-3.5 text-[13px] font-bold text-ink outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand/30",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-lg bg-white text-ink">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-[13px]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
