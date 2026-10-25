import { Label } from "@keuangan-alkautsar/ui/components/label";
import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import type { ReactNode } from "react";

/** Shared look for text inputs, textareas and select triggers inside app forms. */
export const fieldControlClassName =
  "h-[42px] w-full rounded-lg border border-field bg-white px-3 text-sm text-ink placeholder:text-ink-subtle/80 outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 aria-invalid:border-expense aria-invalid:ring-expense/15 disabled:cursor-not-allowed disabled:bg-canvas";

export const textareaControlClassName = cn(fieldControlClassName, "h-auto min-h-[76px] py-2.5");

/**
 * Label + control + inline error. Pass the control as children and give it the same `id`
 * as `htmlFor`, plus `aria-invalid`/`aria-describedby={errorId(id)}` when `error` is set.
 */
export function FormField({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={id} className="text-[13px] font-bold text-ink">
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={errorId(id)} className="text-xs text-expense">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function errorId(id: string) {
  return `${id}-error`;
}

/** Spread onto a control to wire it to its FormField error. */
export function invalidProps(id: string, error: string | undefined) {
  return error
    ? ({ "aria-invalid": true, "aria-describedby": errorId(id) } as const)
    : ({} as const);
}

/** First validation message from a TanStack Form field, which may hold strings or issues. */
export function firstError(errors: readonly unknown[]): string | undefined {
  const [first] = errors;
  if (!first) return undefined;
  if (typeof first === "string") return first;
  if (typeof first === "object" && "message" in first) return String(first.message);
  return undefined;
}
