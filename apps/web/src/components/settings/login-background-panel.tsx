import { useRouter } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/action-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Panel, PanelHeader } from "@/components/panel";
import {
  removeLoginBackground,
  uploadLoginBackground,
  type MosqueSettings,
} from "@/functions/settings";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Object URL for a picked file, revoked when the file changes or the panel unmounts. */
function usePreviewUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

/** "Latar halaman masuk": pick, preview, upload, replace or remove the sign-in background. */
export function LoginBackgroundPanel({
  background,
}: {
  background: MosqueSettings["loginBackground"];
}) {
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const previewUrl = usePreviewUrl(picked);

  function choose(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (!(ACCEPT as readonly string[]).includes(file.type)) {
      setError("Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Ukuran gambar melebihi 5 MB.");
      return;
    }
    setError(null);
    setPicked(file);
  }

  async function save() {
    if (!picked) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", picked);
      await uploadLoginBackground({ data: formData });
      setPicked(null);
      toast.success("Latar halaman masuk diperbarui.");
      await router.invalidate();
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Gambar gagal diunggah. Coba lagi.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setRemoving(true);
    try {
      await removeLoginBackground();
      setConfirmRemove(false);
      toast.success("Latar halaman masuk dihapus.");
      await router.invalidate();
    } catch (cause) {
      toast.error(
        cause instanceof Error && cause.message ? cause.message : "Gambar gagal dihapus.",
      );
    } finally {
      setRemoving(false);
    }
  }

  const pickButton = (label: string) => (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={saving || removing}
      aria-describedby={hintId}
      className="rounded-md px-2 py-1.5 text-[13px] font-bold whitespace-nowrap text-link outline-none hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-income/40 disabled:opacity-60"
    >
      {label}
    </button>
  );

  const shown = picked
    ? { name: picked.name, size: picked.size, src: previewUrl }
    : background
      ? {
          name: background.fileName,
          size: background.size,
          src: `/api/login-background?v=${background.id}`,
        }
      : null;

  return (
    <Panel aria-labelledby="login-background-title" className="gap-2.5 p-5">
      <PanelHeader title="Latar halaman masuk" titleId="login-background-title" />
      <p id={hintId} className="text-xs text-ink-muted">
        JPG, PNG, atau WebP · maksimum 5 MB. Ukuran yang disarankan 1920 × 1080 piksel.
      </p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT.join(",")}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(event) => choose(event.target.files?.[0])}
        disabled={saving || removing}
      />

      {shown ? (
        <div className="flex flex-col gap-3 rounded-[7px] border border-field p-3 sm:flex-row sm:items-center">
          <div className="aspect-video w-full shrink-0 overflow-hidden rounded-md bg-canvas sm:w-40">
            {shown.src ? (
              <img
                src={shown.src}
                alt={picked ? "Pratinjau gambar yang dipilih" : "Latar halaman masuk saat ini"}
                className="size-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate text-[13px] font-bold text-ink" title={shown.name}>
              {shown.name}
            </p>
            <p className="text-xs text-ink-muted">
              {formatSize(shown.size)} · {picked ? "Belum disimpan" : "Sedang digunakan"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {picked ? (
              <>
                <ActionButton
                  tone="outline"
                  size="sm"
                  onClick={() => setPicked(null)}
                  disabled={saving}
                >
                  Batal
                </ActionButton>
                <ActionButton tone="income" size="sm" onClick={save} pending={saving}>
                  Simpan gambar
                </ActionButton>
              </>
            ) : (
              <>
                {pickButton("Ganti gambar")}
                <ActionButton
                  tone="ghost"
                  size="sm"
                  className="text-expense hover:bg-expense-surface"
                  onClick={() => setConfirmRemove(true)}
                >
                  Hapus
                </ActionButton>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-14 items-center justify-between gap-3 rounded-[7px] border border-field px-4 py-2">
          <span className="flex items-center gap-2 text-[13px] text-ink-muted">
            <ImageIcon className="size-4 shrink-0" aria-hidden />
            Belum ada gambar dipilih
          </span>
          {pickButton("Pilih gambar")}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-xs text-expense">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={(open) => {
          if (!removing) setConfirmRemove(open);
        }}
        title="Hapus latar halaman masuk?"
        description={`Gambar ${background?.fileName ?? ""} akan dihapus dan halaman masuk kembali memakai tampilan bawaan.`}
        confirmLabel="Hapus gambar"
        onConfirm={remove}
        pending={removing}
      />
    </Panel>
  );
}
