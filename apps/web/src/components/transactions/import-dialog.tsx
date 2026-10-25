import { CircleAlert, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/action-button";
import { AppDialog, AppDialogFooter } from "@/components/app-dialog";
import { FileDropzone } from "@/components/file-dropzone";
import { InfoNote } from "@/components/info-note";
import { importTransactions } from "@/functions/transactions";

import { kindCopy, paymentMethods, type TransactionKind } from "./model";

// Browsers report CSV as text/csv, or as the Excel type on Windows.
const csvAccept = ["text/csv", "application/vnd.ms-excel", "text/plain"] as const;
const MAX_ERRORS_SHOWN = 20;

/** Uploads a CSV of transactions of one kind; all rows are saved or none are. */
export function ImportDialog({
  kind,
  open,
  onOpenChange,
  onImported,
}: {
  kind: TransactionKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const copy = kindCopy[kind];
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<{ line: number; message: string }[]>([]);
  const [formError, setFormError] = useState<string>();

  function reset() {
    setFile(null);
    setErrors([]);
    setFormError(undefined);
  }

  async function submit() {
    setErrors([]);
    setFormError(undefined);
    if (!file) {
      setFormError("Pilih berkas CSV terlebih dahulu.");
      return;
    }
    setPending(true);
    try {
      const result = await importTransactions({
        data: { kind, fileName: file.name, text: await file.text() },
      });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      toast.success(`${result.count} transaksi ${copy.noun} berhasil diimpor.`);
      reset();
      onImported();
    } catch (error) {
      setFormError(
        error instanceof Error && error.message && !/fetch|network/i.test(error.message)
          ? error.message
          : "Impor gagal. Periksa koneksi Anda, lalu coba lagi.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title={`Impor ${copy.noun} dari CSV`}
      description="Semua baris diperiksa lebih dulu. Jika ada satu baris salah, tidak ada data yang disimpan."
      footer={
        <AppDialogFooter>
          <ActionButton tone="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Batal
          </ActionButton>
          <ActionButton tone={kind} onClick={submit} pending={pending}>
            Impor transaksi
          </ActionButton>
        </AppDialogFooter>
      }
    >
      <div className="flex flex-col gap-4">
        <InfoNote>
          <p>
            Kolom: <strong>tanggal</strong> (YYYY-MM-DD atau DD/MM/YYYY), <strong>kode_tipe</strong>{" "}
            atau nama tipe, <strong>jumlah</strong>, <strong>metode</strong> (
            {paymentMethods.join("/")}, opsional)
            {kind === "expense" ? (
              <>
                , <strong>penerima</strong> (opsional)
              </>
            ) : null}
            , <strong>keterangan</strong> (opsional). Pemisah koma atau titik koma.
          </p>
          <a
            href={`/api/transaksi/template?kind=${kind}`}
            download
            className="mt-2 inline-flex items-center gap-1.5 rounded font-bold underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            <Download className="size-3.5" aria-hidden />
            Unduh templat CSV
          </a>
        </InfoNote>

        <FileDropzone
          accept={csvAccept}
          hint="Berkas CSV · Maks. 5 MB"
          file={file}
          onFileChange={(next) => {
            setFile(next);
            setErrors([]);
            setFormError(undefined);
          }}
        />

        {formError ? (
          <p role="alert" className="flex items-start gap-2 text-xs text-expense">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {formError}
          </p>
        ) : null}

        {errors.length > 0 ? (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-lg bg-expense-surface px-3.5 py-3 text-xs"
          >
            <p className="font-bold text-expense">
              {errors.length} baris perlu diperbaiki. Tidak ada data yang disimpan.
            </p>
            <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto text-ink-body">
              {errors.slice(0, MAX_ERRORS_SHOWN).map((error) => (
                <li key={`${error.line}-${error.message}`}>
                  <span className="font-bold">Baris {error.line}:</span> {error.message}
                </li>
              ))}
              {errors.length > MAX_ERRORS_SHOWN ? (
                <li className="text-ink-muted">
                  …dan {errors.length - MAX_ERRORS_SHOWN} baris lainnya.
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </AppDialog>
  );
}
