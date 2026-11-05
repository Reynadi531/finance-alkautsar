import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@keuangan-alkautsar/ui/components/dialog";
import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Modal shell shared by every app dialog: title + description, square close button,
 * scrollable body, and an optional footer row. Dialog spec: 680px wide, 14px radius, 30px
 * padding, 22px gap. Escape and the overlay close it.
 */
export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  eyebrow,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Small uppercase label above the title, e.g. "RINCIAN PERUBAHAN". */
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[calc(100svh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-[22px] rounded-[14px] bg-white p-6 text-ink shadow-none ring-0 sm:max-w-[680px] sm:p-[30px]",
          className,
        )}
      >
        <div className="relative flex shrink-0 flex-col gap-2.5 pr-[54px]">
          {eyebrow ? (
            <p className="text-[10px] font-bold tracking-[0.12em] text-ink-label uppercase">
              {eyebrow}
            </p>
          ) : null}
          <DialogTitle className="text-[23px] leading-tight font-semibold text-ink sm:text-[26px]">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-xs/5 text-ink-muted">
              {description}
            </DialogDescription>
          ) : null}
          <DialogClose
            aria-label="Tutup"
            className="absolute top-0 right-0 flex size-[42px] shrink-0 items-center justify-center rounded-lg bg-muted-surface text-ink-strong outline-none hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-primary-action/40"
          >
            <X className="size-[18px]" aria-hidden />
          </DialogClose>
        </div>
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 py-1">{children}</div>
        {footer ? <div className="shrink-0">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Footer layout: optional note on the left ("* Wajib diisi"), actions on the right. */
export function AppDialogFooter({ note, children }: { note?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:order-2 [&>*]:w-full sm:[&>*]:w-auto">
        {children}
      </div>
      {note ? (
        <p className="text-[10px] text-ink-muted sm:order-1">{note}</p>
      ) : (
        <span className="hidden sm:order-1 sm:block" />
      )}
    </div>
  );
}
