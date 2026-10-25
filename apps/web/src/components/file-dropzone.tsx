import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { FileText, Upload, X } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Single-file picker with drag-and-drop. Validates type and the 5 MB limit on the client;
 * the server re-validates. `existingName` shows a file already attached to the record.
 */
export function FileDropzone({
  id,
  accept,
  hint,
  file,
  onFileChange,
  existingName,
  onRemoveExisting,
  error,
}: {
  id?: string;
  /** MIME types, e.g. ["image/jpeg", "image/png", "application/pdf"]. */
  accept: readonly string[];
  hint: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  existingName?: string | null;
  onRemoveExisting?: () => void;
  error?: string;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string>();

  function choose(next: File | undefined) {
    if (!next) return;
    if (!accept.includes(next.type)) {
      setLocalError("Format berkas tidak didukung.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setLocalError("Ukuran berkas melebihi 5 MB.");
      return;
    }
    setLocalError(undefined);
    onFileChange(next);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  const shownError = localError ?? error;
  const shownName = file?.name ?? existingName;

  return (
    <div className="flex flex-col gap-2">
      {shownName ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-3.5 py-3">
          <FileText className="size-4 shrink-0 text-ink-muted" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">
            {shownName}
          </span>
          <button
            type="button"
            onClick={() => {
              if (file) {
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = "";
              } else {
                onRemoveExisting?.();
              }
            }}
            className="flex size-7 items-center justify-center rounded-md text-ink-muted outline-none hover:bg-line focus-visible:ring-2 focus-visible:ring-brand/30"
            aria-label={`Hapus berkas ${shownName}`}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-field bg-canvas px-4 py-5 text-center outline-none transition-colors hover:bg-action-hover has-focus-visible:ring-2 has-focus-visible:ring-brand/30",
            dragging && "border-brand bg-info-surface",
            shownError && "border-expense",
          )}
        >
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-link">
            <Upload className="size-3.5" aria-hidden />
            Pilih berkas atau tarik ke sini
          </span>
          <span className="text-[11px] text-ink-muted">{hint}</span>
        </label>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept.join(",")}
        className="sr-only"
        onChange={(event) => choose(event.target.files?.[0])}
      />
      {shownError ? (
        <p role="alert" className="text-xs text-expense">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
