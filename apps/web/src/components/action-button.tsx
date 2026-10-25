import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

/**
 * App button styles from the Pencil screens. `tone` picks the filled colour per screen:
 * income pages use green, expense pages red, everything else brand blue.
 */
export const actionButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-bold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        brand: "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand/40",
        income: "bg-income text-white hover:bg-income-hover focus-visible:ring-income/40",
        expense: "bg-expense text-white hover:bg-expense-hover focus-visible:ring-expense/40",
        outline: "border border-line bg-white text-ink hover:bg-canvas focus-visible:ring-brand/30",
        ghost: "text-brand hover:bg-info-surface focus-visible:ring-brand/30",
      },
      size: {
        default: "h-[38px] px-4 text-[13px]",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5 text-sm",
      },
    },
    defaultVariants: { tone: "brand", size: "default" },
  },
);

export type ActionButtonProps = ComponentProps<"button"> &
  VariantProps<typeof actionButtonVariants> & {
    /** Shows a spinner, disables the button, and keeps its label for screen readers. */
    pending?: boolean;
  };

export function ActionButton({
  className,
  tone,
  size,
  pending,
  disabled,
  children,
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(actionButtonVariants({ tone, size }), className)}
      {...props}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
