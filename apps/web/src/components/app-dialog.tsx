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
 * Modal shell shared by every app dialog: title + description, close button, divider,
 * scrollable body, and an optional footer row. Escape and the overlay close it.
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
          "flex max-h-[calc(100svh-2rem)] w-full flex-col gap-0 rounded-2xl bg-white p-0 text-ink shadow-2xl ring-0 sm:max-w-[550px]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-6 sm:px-[26px] sm:pt-7">
          <div className="flex min-w-0 flex-col gap-1.5">
            {eyebrow ? (
              <p className="text-[10px] font-bold tracking-[0.12em] text-ink-label uppercase">
                {eyebrow}
              </p>
            ) : null}
            <DialogTitle className="font-display text-[22px] font-bold text-ink">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="text-xs text-ink-muted">
                {description}
              </DialogDescription>
            ) : null}
          </div>
          <DialogClose
            aria-label="Tutup"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-muted outline-none hover:bg-line focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <X className="size-4" aria-hidden />
          </DialogClose>
        </div>
        <div className="mx-5 mt-5 h-px shrink-0 bg-line sm:mx-[26px]" />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-[26px]">{children}</div>
        {footer ? (
          <>
            <div className="mx-5 h-px shrink-0 bg-line sm:mx-[26px]" />
            <div className="px-5 pt-5 pb-6 sm:px-[26px] sm:pb-7">{footer}</div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Footer layout: optional note on the left ("* Wajib diisi"), actions on the right. */
export function AppDialogFooter({ note, children }: { note?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      {note ? <p className="text-[11px] text-ink-muted">{note}</p> : <span />}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">{children}</div>
    </div>
  );
}
