import { useForm } from "@tanstack/react-form";
import { CircleAlert } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/action-button";
import { AppDialog, AppDialogFooter } from "@/components/app-dialog";
import { AppSelect } from "@/components/app-select";
import { FileDropzone } from "@/components/file-dropzone";
import {
  FormField,
  fieldControlClassName,
  firstError,
  invalidProps,
  textareaControlClassName,
} from "@/components/form-field";
import {
  saveTransaction,
  type FieldErrors,
  type TransactionPageData,
} from "@/functions/transactions";
import { todayIso } from "@/lib/date-range";

import {
  formatAmountInput,
  kindCopy,
  paymentMethods,
  transactionFormSchema,
  type TransactionFormValues,
  type TransactionKind,
} from "./model";
import type { TransactionListRow } from "./transaction-table";

const proofAccept = ["image/jpeg", "image/png", "application/pdf"] as const;
const NO_METHOD = "none";
const methodOptions = [
  { value: NO_METHOD, label: "Tidak dicatat" },
  ...paymentMethods.map((method) => ({ value: method, label: method })),
];

type Category = TransactionPageData["categories"][number];

function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    form?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  });
}

/** Add/edit dialog for one transaction. Mount with a new `key` per record to reset it. */
export function TransactionFormDialog({
  kind,
  open,
  onOpenChange,
  row,
  categories,
  mosqueName,
  onSaved,
}: {
  kind: TransactionKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Record being edited; null adds a new one. */
  row: TransactionListRow | null;
  categories: readonly Category[];
  mosqueName: string;
  onSaved: () => void;
}) {
  const copy = kindCopy[kind];
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [proof, setProof] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);

  const categoryOptions = categories.map((item) => ({ value: item.id, label: item.name }));
  if (row && !categories.some((item) => item.id === row.categoryId)) {
    categoryOptions.unshift({
      value: row.categoryId,
      label: row.categoryArchived ? `${row.categoryName} (diarsipkan)` : row.categoryName,
    });
  }

  const form = useForm({
    defaultValues: {
      effectiveDate: row?.effectiveDate ?? todayIso(),
      categoryId: row?.categoryId ?? "",
      amount: row ? formatAmountInput(String(row.amount)) : "",
      paymentMethod: row?.paymentMethod ?? "",
      recipient: row?.recipient ?? "",
      description: row?.description ?? "",
    } satisfies TransactionFormValues as TransactionFormValues,
    validators: { onSubmit: transactionFormSchema },
    onSubmitInvalid: () => focusFirstInvalid(formRef.current),
    onSubmit: async ({ value }) => {
      setServerErrors({});
      setFormError(undefined);
      const data = new FormData();
      if (row) data.set("id", row.id);
      data.set("kind", kind);
      for (const [key, fieldValue] of Object.entries(value)) data.set(key, fieldValue);
      data.set("removeProof", removeExisting ? "1" : "0");
      if (proof) data.set("proof", proof);
      try {
        const result = await saveTransaction({ data });
        if (!result.ok) {
          setServerErrors(result.fieldErrors);
          focusFirstInvalid(formRef.current);
          return;
        }
        toast.success(
          row
            ? `Perubahan ${result.ref} tersimpan.`
            : `${copy.noun[0].toUpperCase()}${copy.noun.slice(1)} ${result.ref} tersimpan.`,
        );
        onSaved();
      } catch (error) {
        setFormError(
          error instanceof Error && error.message && !/fetch|network/i.test(error.message)
            ? error.message
            : "Tidak dapat menyimpan. Periksa koneksi Anda, lalu coba lagi.",
        );
      }
    },
  });

  const existingProofName = row?.proofFileId && !removeExisting ? row.proofFileName : null;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={row ? `Edit ${copy.noun}` : copy.addLabel}
      description={
        row ? `Perbarui rincian transaksi ${row.ref}.` : copy.dialogDescription(mosqueName)
      }
      footer={
        <AppDialogFooter note="* Wajib diisi">
          <ActionButton tone="outline" onClick={() => onOpenChange(false)}>
            Batal
          </ActionButton>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <ActionButton type="submit" form={formId} tone={kind} pending={isSubmitting}>
                {row ? "Simpan perubahan" : `Simpan ${copy.noun}`}
              </ActionButton>
            )}
          </form.Subscribe>
        </AppDialogFooter>
      }
    >
      <form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg bg-expense-surface px-3.5 py-3 text-xs text-expense"
          >
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            <p className="pt-px">{formError}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form.Field name="effectiveDate">
            {(field) => {
              const id = `${formId}-date`;
              const error = firstError(field.state.meta.errors) ?? serverErrors.effectiveDate;
              return (
                <FormField id={id} label="Tanggal" required error={error}>
                  <input
                    id={id}
                    type="date"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className={fieldControlClassName}
                    {...invalidProps(id, error)}
                  />
                </FormField>
              );
            }}
          </form.Field>

          <form.Field name="categoryId">
            {(field) => {
              const id = `${formId}-category`;
              const error = firstError(field.state.meta.errors) ?? serverErrors.categoryId;
              return (
                <FormField
                  id={id}
                  label={copy.typeLabel}
                  required
                  error={error}
                  hint={
                    categoryOptions.length === 0
                      ? "Belum ada tipe aktif. Minta administrator menambahkannya."
                      : undefined
                  }
                >
                  <AppSelect
                    id={id}
                    value={field.state.value || null}
                    onValueChange={field.handleChange}
                    options={categoryOptions}
                    placeholder="Pilih kategori"
                    {...invalidProps(id, error)}
                  />
                </FormField>
              );
            }}
          </form.Field>

          <form.Field name="amount">
            {(field) => {
              const id = `${formId}-amount`;
              const error = firstError(field.state.meta.errors) ?? serverErrors.amount;
              return (
                <FormField id={id} label="Jumlah (Rp)" required error={error}>
                  <input
                    id={id}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Contoh: 500.000"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(formatAmountInput(event.target.value))}
                    onBlur={field.handleBlur}
                    className={fieldControlClassName}
                    {...invalidProps(id, error)}
                  />
                </FormField>
              );
            }}
          </form.Field>

          <form.Field name="paymentMethod">
            {(field) => {
              const id = `${formId}-method`;
              const error = serverErrors.paymentMethod;
              return (
                <FormField id={id} label="Metode pembayaran" error={error}>
                  <AppSelect
                    id={id}
                    value={field.state.value || null}
                    onValueChange={(next) => field.handleChange(next === NO_METHOD ? "" : next)}
                    options={methodOptions}
                    placeholder="Pilih metode"
                    {...invalidProps(id, error)}
                  />
                </FormField>
              );
            }}
          </form.Field>
        </div>

        {kind === "expense" ? (
          <form.Field name="recipient">
            {(field) => {
              const id = `${formId}-recipient`;
              const error = firstError(field.state.meta.errors) ?? serverErrors.recipient;
              return (
                <FormField id={id} label="Penerima" error={error}>
                  <input
                    id={id}
                    placeholder="Nama penerima (opsional)"
                    value={field.state.value}
                    maxLength={120}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className={fieldControlClassName}
                    {...invalidProps(id, error)}
                  />
                </FormField>
              );
            }}
          </form.Field>
        ) : null}

        <form.Field name="description">
          {(field) => {
            const id = `${formId}-description`;
            const error = firstError(field.state.meta.errors) ?? serverErrors.description;
            return (
              <FormField id={id} label="Keterangan" error={error}>
                <textarea
                  id={id}
                  rows={3}
                  placeholder={copy.descriptionPlaceholder}
                  value={field.state.value}
                  maxLength={500}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  className={textareaControlClassName}
                  {...invalidProps(id, error)}
                />
              </FormField>
            );
          }}
        </form.Field>

        <FormField id={`${formId}-proof`} label={copy.proofLabel}>
          <FileDropzone
            id={`${formId}-proof`}
            accept={proofAccept}
            hint="JPG, PNG atau PDF · Maks. 5 MB"
            file={proof}
            onFileChange={(next) => {
              setProof(next);
              setServerErrors(({ proof: _proof, ...rest }) => rest);
            }}
            existingName={existingProofName}
            onRemoveExisting={() => setRemoveExisting(true)}
            error={serverErrors.proof}
          />
        </FormField>
      </form>
    </AppDialog>
  );
}
