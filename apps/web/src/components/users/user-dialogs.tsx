import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { ActionButton } from "@/components/action-button";
import { AppDialog, AppDialogFooter } from "@/components/app-dialog";
import { AppSelect } from "@/components/app-select";
import {
  fieldControlClassName,
  firstError,
  FormField,
  invalidProps,
} from "@/components/form-field";
import { InfoNote } from "@/components/info-note";
import { PasswordInput } from "@/components/users/password-input";
import { roleOptions } from "@/components/users/user-display";
import {
  createUser,
  MIN_PASSWORD_LENGTH,
  resetUserPassword,
  updateUser,
  type UserRow,
} from "@/functions/users";
import type { UserRole } from "@/server/mosque";

const nameRule = z
  .string()
  .trim()
  .min(1, "Nama lengkap wajib diisi.")
  .max(100, "Nama lengkap maksimal 100 karakter.");
const roleRule = z.enum(["admin", "treasurer", "viewer"], "Pilih peran pengguna.");
const passwordRule = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`)
  .max(128, "Kata sandi maksimal 128 karakter.");

/** Keeps showing the last target while the dialog animates closed. */
function useLastTarget(target: UserRow | null) {
  const last = useRef(target);
  if (target) last.current = target;
  return last.current;
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Perubahan gagal disimpan. Coba lagi.";
}

function focusFirstInvalid(form: HTMLFormElement | null) {
  form?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
}

/** Form-level failure (network/server) shown above the footer. */
function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-expense-surface px-3.5 py-3 text-xs text-expense">
      {message}
    </p>
  );
}

const createSchema = z.object({
  name: nameRule,
  email: z.string().trim().pipe(z.email("Masukkan alamat email yang valid.")),
  password: passwordRule,
  role: roleRule,
});

/** S07 "Tambah pengguna": creates an account with a temporary password and a role. */
export function CreateUserDialog({
  open,
  onOpenChange,
  mosqueName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mosqueName: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [emailTaken, setEmailTaken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", role: "" as UserRole | "" },
    validators: { onSubmit: createSchema },
    onSubmitInvalid: () => setTimeout(() => focusFirstInvalid(formRef.current)),
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const result = await createUser({ data: createSchema.parse(value) });
        if (!result.ok) {
          setEmailTaken(result.message);
          setTimeout(() => formRef.current?.querySelector<HTMLElement>("#user-email")?.focus());
          return;
        }
        toast.success(`Pengguna ${value.name.trim()} berhasil dibuat.`);
        onOpenChange(false);
        form.reset();
        await router.invalidate();
      } catch (error) {
        setFormError(errorMessage(error));
      }
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset();
      setEmailTaken(null);
      setFormError(null);
    }
    onOpenChange(next);
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Tambah pengguna"
      description={`Buat akses untuk anggota tim ${mosqueName}.`}
      footer={
        <AppDialogFooter note="* Wajib diisi">
          <ActionButton tone="outline" onClick={() => handleOpenChange(false)}>
            Batal
          </ActionButton>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(submitting) => (
              <ActionButton tone="brand" type="submit" form="create-user-form" pending={submitting}>
                Buat pengguna
              </ActionButton>
            )}
          </form.Subscribe>
        </AppDialogFooter>
      }
    >
      <form
        id="create-user-form"
        ref={formRef}
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <FormField id="user-name" label="Nama lengkap" required error={error}>
                <input
                  id="user-name"
                  className={fieldControlClassName}
                  placeholder="Contoh: Ahmad Rizki"
                  autoComplete="off"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  {...invalidProps("user-name", error)}
                />
              </FormField>
            );
          }}
        </form.Field>
        <form.Field name="email">
          {(field) => {
            const error = firstError(field.state.meta.errors) ?? emailTaken ?? undefined;
            return (
              <FormField id="user-email" label="Alamat email" required error={error}>
                <input
                  id="user-email"
                  type="email"
                  className={fieldControlClassName}
                  placeholder="nama@masjid.id"
                  autoComplete="off"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    setEmailTaken(null);
                    field.handleChange(event.target.value);
                  }}
                  {...invalidProps("user-email", error)}
                />
              </FormField>
            );
          }}
        </form.Field>
        <form.Field name="password">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <FormField id="user-password" label="Kata sandi sementara" required error={error}>
                <PasswordInput
                  id="user-password"
                  placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  {...invalidProps("user-password", error)}
                />
              </FormField>
            );
          }}
        </form.Field>
        <form.Field name="role">
          {(field) => {
            const error = firstError(field.state.meta.errors);
            return (
              <FormField id="user-role" label="Peran" required error={error}>
                <AppSelect
                  id="user-role"
                  value={field.state.value || null}
                  onValueChange={(value) => field.handleChange(value as UserRole)}
                  options={roleOptions}
                  placeholder="Pilih peran"
                  {...invalidProps("user-role", error)}
                />
              </FormField>
            );
          }}
        </form.Field>
        <InfoNote icon={false}>
          Kata sandi tidak akan ditampilkan kembali dan tidak dicatat dalam riwayat perubahan.
        </InfoNote>
        <FormAlert message={formError} />
      </form>
    </AppDialog>
  );
}

const editSchema = z.object({ name: nameRule, role: roleRule });

/** "Ubah": edits a user's name and role. Own role is locked to prevent self-demotion. */
export function EditUserDialog({
  target,
  isSelf,
  onOpenChange,
}: {
  target: UserRow | null;
  isSelf: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const shown = useLastTarget(target);
  return (
    <AppDialog
      open={target !== null}
      onOpenChange={onOpenChange}
      title="Ubah pengguna"
      description={shown ? `${shown.name} · ${shown.email}` : undefined}
    >
      {shown ? (
        <EditUserForm
          key={shown.id}
          target={shown}
          isSelf={isSelf}
          onDone={() => onOpenChange(false)}
        />
      ) : null}
    </AppDialog>
  );
}

function EditUserForm({
  target,
  isSelf,
  onDone,
}: {
  target: UserRow;
  isSelf: boolean;
  onDone: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { name: target.name, role: (target.role ?? "") as UserRole | "" },
    validators: { onSubmit: editSchema },
    onSubmitInvalid: () => setTimeout(() => focusFirstInvalid(formRef.current)),
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const parsed = editSchema.parse(value);
        const result = await updateUser({ data: { id: target.id, ...parsed } });
        toast.success(result.changed ? "Data pengguna diperbarui." : "Tidak ada perubahan.");
        onDone();
        await router.invalidate();
      } catch (error) {
        setFormError(errorMessage(error));
      }
    },
  });

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => {
          const error = firstError(field.state.meta.errors);
          return (
            <FormField id="edit-user-name" label="Nama lengkap" required error={error}>
              <input
                id="edit-user-name"
                className={fieldControlClassName}
                autoComplete="off"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                {...invalidProps("edit-user-name", error)}
              />
            </FormField>
          );
        }}
      </form.Field>
      <form.Field name="role">
        {(field) => {
          const error = firstError(field.state.meta.errors);
          return (
            <FormField
              id="edit-user-role"
              label="Peran"
              required
              error={error}
              hint={isSelf ? "Anda tidak dapat mengubah peran akun Anda sendiri." : undefined}
            >
              <AppSelect
                id="edit-user-role"
                value={field.state.value || null}
                onValueChange={(value) => field.handleChange(value as UserRole)}
                options={roleOptions}
                placeholder="Pilih peran"
                disabled={isSelf}
                {...invalidProps("edit-user-role", error)}
              />
            </FormField>
          );
        }}
      </form.Field>
      <FormAlert message={formError} />
      <div className="mt-1 flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <ActionButton tone="outline" onClick={onDone}>
          Batal
        </ActionButton>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(submitting) => (
            <ActionButton tone="brand" type="submit" pending={submitting}>
              Simpan perubahan
            </ActionButton>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

const resetSchema = z.object({ password: passwordRule });

/** "Atur ulang kata sandi": sets a new temporary password for another user. */
export function ResetPasswordDialog({
  target,
  isSelf,
  onOpenChange,
}: {
  target: UserRow | null;
  isSelf: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const shown = useLastTarget(target);
  return (
    <AppDialog
      open={target !== null}
      onOpenChange={onOpenChange}
      title="Atur ulang kata sandi"
      description={shown ? `${shown.name} · ${shown.email}` : undefined}
    >
      {shown ? (
        <ResetPasswordForm
          key={shown.id}
          target={shown}
          isSelf={isSelf}
          onDone={() => onOpenChange(false)}
        />
      ) : null}
    </AppDialog>
  );
}

function ResetPasswordForm({
  target,
  isSelf,
  onDone,
}: {
  target: UserRow;
  isSelf: boolean;
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { password: "" },
    validators: { onSubmit: resetSchema },
    onSubmitInvalid: () => setTimeout(() => focusFirstInvalid(formRef.current)),
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        await resetUserPassword({ data: { id: target.id, password: value.password } });
        toast.success(`Kata sandi ${target.name} berhasil diatur ulang.`);
        onDone();
      } catch (error) {
        setFormError(errorMessage(error));
      }
    },
  });

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="password">
        {(field) => {
          const error = firstError(field.state.meta.errors);
          return (
            <FormField id="reset-password" label="Kata sandi sementara baru" required error={error}>
              <PasswordInput
                id="reset-password"
                placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                {...invalidProps("reset-password", error)}
              />
            </FormField>
          );
        }}
      </form.Field>
      <InfoNote icon={false}>
        {isSelf
          ? "Gunakan kata sandi baru ini saat masuk berikutnya."
          : "Pengguna akan dikeluarkan dari semua perangkat dan masuk kembali dengan kata sandi ini."}{" "}
        Kata sandi tidak dicatat dalam riwayat perubahan.
      </InfoNote>
      <FormAlert message={formError} />
      <div className="mt-1 flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <ActionButton tone="outline" onClick={onDone}>
          Batal
        </ActionButton>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(submitting) => (
            <ActionButton tone="brand" type="submit" pending={submitting}>
              Atur ulang kata sandi
            </ActionButton>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
