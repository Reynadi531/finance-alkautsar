import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@keuangan-alkautsar/ui/components/alert-dialog";
import type { ReactNode } from "react";

import { ActionButton } from "@/components/action-button";

/**
 * Confirmation for destructive or irreversible actions. The description must name the
 * record being changed. `onConfirm` may be async; the dialog stays open while it runs.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending,
  tone = "expense",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  tone?: "expense" | "brand";
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="flex w-full flex-col gap-5 rounded-2xl bg-white p-6 text-ink ring-0 sm:max-w-[440px]">
        <div className="flex flex-col gap-2">
          <AlertDialogTitle className="font-display text-xl font-bold text-ink">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] text-ink-muted">
            {description}
          </AlertDialogDescription>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ActionButton tone="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Batal
          </ActionButton>
          <ActionButton tone={tone} onClick={onConfirm} pending={pending}>
            {confirmLabel}
          </ActionButton>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
