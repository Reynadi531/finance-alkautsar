import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

/**
 * App button styles from the Pencil screens. `tone` picks the filled colour per screen:
 * primary actions are deep green everywhere; `expense` stays red for destructive confirms.
 */
export const actionButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-3 rounded-lg font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        brand:
          "bg-primary-action text-white hover:bg-primary-action-hover focus-visible:ring-primary-action/40",
        income:
          "bg-primary-action text-white hover:bg-primary-action-hover focus-visible:ring-primary-action/40",
        expense: "bg-expense text-white hover:bg-expense-hover focus-visible:ring-expense/40",
        outline:
          "border border-control bg-white text-ink hover:bg-muted-surface focus-visible:ring-primary-action/30",
        ghost: "text-link hover:bg-action focus-visible:ring-primary-action/30",
      },
      size: {
        default: "h-12 px-4 text-[13px]",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5 text-sm",
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
