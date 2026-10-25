import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/action-button";
import { AppDialog } from "@/components/app-dialog";
import {
  categoryFormSchema,
  type CategoryKindConfig,
} from "@/components/categories/category-kinds";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  FormField,
  fieldControlClassName,
  firstError,
  invalidProps,
  textareaControlClassName,
} from "@/components/form-field";
import { InfoNote } from "@/components/info-note";
import { StatusBadge } from "@/components/status-badge";
import {
  deleteCategory,
  saveCategory,
  setCategoryArchived,
  type CategoryFieldErrors,
  type CategoryListItem,
  type CategoryMutationResult,
} from "@/functions/categories";
import { formatTableDate } from "@/lib/date-range";

const FORM_ID = "category-form";

function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => form?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
}

/**
 * Add (`category` null) or edit dialog for one category kind. Editing also offers archive /
 * restore and, for never-used types, permanent deletion behind a confirmation.
 */
export function CategoryDialog({
  open,
  onOpenChange,
  config,
  category,
  nextCode,
  formKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CategoryKindConfig;
  category: CategoryListItem | null;
  nextCode: string;
  /** Changes on every open so the form starts from fresh values. */
  formKey: number;
}) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={category ? "Ubah tipe" : "Tambah tipe baru"}
      description={
        category
          ? category.archived
            ? `Tipe ini diarsipkan dan tidak muncul di formulir catat ${config.noun}.`
            : `Perubahan nama berlaku di formulir dan riwayat transaksi ${config.noun}.`
          : `Tipe baru akan tersedia di formulir catat ${config.noun}.`
      }
      className="sm:max-w-[480px]"
    >
      <CategoryForm
        key={formKey}
        config={config}
        category={category}
        nextCode={nextCode}
        onDone={() => onOpenChange(false)}
      />
    </AppDialog>
  );
}

function CategoryForm({
  config,
  category,
  nextCode,
  onDone,
}: {
  config: CategoryKindConfig;
  category: CategoryListItem | null;
  nextCode: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [serverErrors, setServerErrors] = useState<CategoryFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);
  const [busy, setBusy] = useState<"archive" | "restore" | "delete" | null>(null);

  /** Shared handling for every mutation result; returns true on success. */
  async function settle(
    result: CategoryMutationResult,
    success: string,
    alwaysShowMessage = false,
  ) {
    if (!result.ok) {
      setServerErrors(result.fieldErrors ?? {});
      setFormError(result.fieldErrors && !alwaysShowMessage ? null : result.message);
      if (result.fieldErrors) focusFirstInvalid(formRef.current);
      return false;
    }
    toast.success(success);
    onDone();
    await router.invalidate();
    return true;
  }

  const form = useForm({
    defaultValues: {
      name: category?.name ?? "",
      code: category?.code ?? nextCode,
      note: category?.note ?? "",
    },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: categoryFormSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const result = await saveCategory({
          data: { id: category?.id, kind: config.kind, ...value },
        });
        await settle(
          result,
          category ? "Perubahan tipe disimpan." : `Tipe ${config.noun} ditambahkan.`,
        );
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Tipe gagal disimpan. Coba lagi.");
      }
    },
    onSubmitInvalid: () => focusFirstInvalid(formRef.current),
  });

  async function run(action: "archive" | "restore" | "delete") {
    setBusy(action);
    setFormError(null);
    try {
      const result =
        action === "delete"
          ? await deleteCategory({ data: { id: category!.id } })
          : await setCategoryArchived({
              data: { id: category!.id, archived: action === "archive" },
            });
      const done = await settle(
        result,
        action === "archive"
          ? `“${category!.name}” diarsipkan.`
          : action === "restore"
            ? `“${category!.name}” dipulihkan.`
            : `“${category!.name}” dihapus.`,
        true,
      );
      if (!done) setConfirm(null);
    } catch (error) {
      setConfirm(null);
      setFormError(error instanceof Error ? error.message : "Tindakan gagal. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form
      id={FORM_ID}
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      {category ? <UsageSummary category={category} /> : null}

      {formError ? (
        <p role="alert" className="rounded-lg bg-expense-surface px-3.5 py-3 text-xs text-expense">
          {formError}
        </p>
      ) : null}

      <form.Field name="name">
        {(field) => {
          const error = serverErrors.name ?? firstError(field.state.meta.errors);
          return (
            <FormField id="category-name" label="Nama tipe" required error={error}>
              <input
                id="category-name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  setServerErrors((current) => ({ ...current, name: undefined }));
                  field.handleChange(event.target.value);
                }}
                placeholder={config.namePlaceholder}
                autoComplete="off"
                maxLength={60}
                className={fieldControlClassName}
                {...invalidProps("category-name", error)}
              />
            </FormField>
          );
        }}
      </form.Field>

      <form.Field name="code">
        {(field) => {
          const error = serverErrors.code ?? firstError(field.state.meta.errors);
          return (
            <FormField
              id="category-code"
              label="Kode tipe"
              required
              error={error}
              hint={category ? undefined : "Disarankan otomatis dari kode terakhir; boleh diubah."}
            >
              <input
                id="category-code"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  setServerErrors((current) => ({ ...current, code: undefined }));
                  field.handleChange(event.target.value.toUpperCase());
                }}
                placeholder={`Contoh: ${nextCode}`}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
                className={fieldControlClassName}
                {...invalidProps("category-code", error)}
              />
            </FormField>
          );
        }}
      </form.Field>

      <form.Field name="note">
        {(field) => {
          const error = firstError(field.state.meta.errors);
          return (
            <FormField id="category-note" label="Catatan (opsional)" error={error}>
              <textarea
                id="category-note"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={config.notePlaceholder}
                rows={3}
                maxLength={300}
                className={textareaControlClassName}
                {...invalidProps("category-note", error)}
              />
            </FormField>
          );
        }}
      </form.Field>

      <InfoNote>Tipe yang sudah dipakai tidak bisa dihapus, tetapi dapat diarsipkan.</InfoNote>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {category && !category.archived ? (
                <ActionButton
                  tone="outline"
                  onClick={() => setConfirm("archive")}
                  disabled={isSubmitting || busy !== null}
                >
                  <Archive aria-hidden />
                  Arsipkan
                </ActionButton>
              ) : null}
              {category?.archived ? (
                <ActionButton
                  tone="outline"
                  onClick={() => run("restore")}
                  pending={busy === "restore"}
                  disabled={isSubmitting || busy !== null}
                >
                  {busy === "restore" ? null : <ArchiveRestore aria-hidden />}
                  Pulihkan
                </ActionButton>
              ) : null}
              {category?.deletable ? (
                <ActionButton
                  tone="outline"
                  onClick={() => setConfirm("delete")}
                  disabled={isSubmitting || busy !== null}
                  className="text-expense"
                >
                  <Trash2 aria-hidden />
                  Hapus
                </ActionButton>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <ActionButton tone="outline" onClick={onDone} disabled={isSubmitting}>
                Batal
              </ActionButton>
              <ActionButton
                type="submit"
                tone="brand"
                pending={isSubmitting}
                disabled={busy !== null}
              >
                Simpan tipe
              </ActionButton>
            </div>
          </div>
        )}
      </form.Subscribe>

      {category ? (
        <>
          <ConfirmDialog
            open={confirm === "archive"}
            onOpenChange={(open) => !open && setConfirm(null)}
            tone="brand"
            title={`Arsipkan “${category.name}”?`}
            description={
              <>
                {category.name} ({category.code}) tidak akan muncul lagi di formulir catat{" "}
                {config.noun}.{" "}
                {category.transactionCount > 0
                  ? `${category.transactionCount} transaksi yang sudah tercatat tetap memakai tipe ini.`
                  : "Anda dapat memulihkannya kapan saja."}
              </>
            }
            confirmLabel="Arsipkan tipe"
            pending={busy === "archive"}
            onConfirm={() => run("archive")}
          />
          <ConfirmDialog
            open={confirm === "delete"}
            onOpenChange={(open) => !open && setConfirm(null)}
            title={`Hapus “${category.name}”?`}
            description={`${category.name} (${category.code}) belum pernah dipakai dan akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
            confirmLabel="Hapus tipe"
            pending={busy === "delete"}
            onConfirm={() => run("delete")}
          />
        </>
      ) : null}
    </form>
  );
}

function UsageSummary({ category }: { category: CategoryListItem }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-canvas px-3.5 py-3 text-xs sm:grid-cols-3">
      <div className="flex flex-col gap-1">
        <dt className="text-ink-muted">Status</dt>
        <dd>
          <StatusBadge
            tone={category.archived ? "neutral" : "brand"}
            dot={category.archived ? "hollow" : "filled"}
          >
            {category.archived ? "Diarsipkan" : "Aktif"}
          </StatusBadge>
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-ink-muted">Dipakai</dt>
        <dd className="py-1 font-bold text-ink">{category.transactionCount} transaksi</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-ink-muted">Terakhir dipakai</dt>
        <dd className="py-1 font-bold text-ink">
          {category.lastUsed ? formatTableDate(category.lastUsed) : "Belum pernah"}
        </dd>
      </div>
    </dl>
  );
}
