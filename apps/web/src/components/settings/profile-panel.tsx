import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { ActionButton } from "@/components/action-button";
import {
  fieldControlClassName,
  firstError,
  FormField,
  invalidProps,
} from "@/components/form-field";
import { MosqueLogo } from "@/components/mosque-identity";
import { Panel, PanelHeader } from "@/components/panel";
import type { MosqueSettings } from "@/functions/settings";
import { saveMosqueProfile } from "@/functions/settings";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama masjid wajib diisi.")
    .max(120, "Nama masjid maksimal 120 karakter."),
  address: z.string().trim().max(300, "Alamat maksimal 300 karakter."),
  phone: z
    .string()
    .trim()
    .max(30, "Nomor telepon maksimal 30 karakter.")
    .refine(
      (value) => value === "" || /^[0-9+()\-.\s]{5,30}$/.test(value),
      "Nomor telepon hanya boleh berisi angka, spasi, +, -, dan tanda kurung.",
    ),
});

const fields = [
  {
    name: "name",
    label: "Nama masjid",
    required: true,
    autoComplete: "organization",
    placeholder: "Contoh: Masjid Al-Kautsar",
  },
  {
    name: "address",
    label: "Alamat",
    required: false,
    autoComplete: "street-address",
    placeholder: "Jalan, nomor, kota",
  },
  {
    name: "phone",
    label: "Nomor telepon",
    required: false,
    autoComplete: "tel",
    placeholder: "Contoh: (022) 720 1840",
  },
] as const;

/** "Profil masjid": name, address and phone of the singleton mosque row. */
export function ProfilePanel({ settings }: { settings: MosqueSettings }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: settings.name,
      address: settings.address ?? "",
      phone: settings.phone ?? "",
    },
    validators: { onSubmit: profileSchema },
    onSubmitInvalid: () =>
      setTimeout(() =>
        formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      ),
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const saved = await saveMosqueProfile({ data: value });
        // Re-baseline the form on the saved values; the sidebar picks up the new name.
        form.reset({ name: saved.name, address: saved.address ?? "", phone: saved.phone ?? "" });
        toast.success("Pengaturan masjid disimpan.");
        await router.invalidate();
      } catch (error) {
        // Edits stay in the form so the admin can retry.
        setFormError(
          error instanceof Error && error.message
            ? error.message
            : "Pengaturan gagal disimpan. Periksa koneksi Anda, lalu coba lagi.",
        );
      }
    },
  });

  return (
    <Panel aria-labelledby="profile-title" className="gap-5 p-6">
      <PanelHeader title="Profil masjid" titleId="profile-title" />
      <div className="flex items-center gap-[18px]">
        <MosqueLogo className="size-20 rounded-lg border border-line p-2.5" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-sm leading-[22px] font-semibold text-ink">{settings.name}</p>
          <p className="text-[11px] text-ink-muted">Pratinjau logo masjid</p>
        </div>
      </div>
      <form
        ref={formRef}
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        {fields.map((config) => (
          <form.Field key={config.name} name={config.name}>
            {(field) => {
              const id = `mosque-${config.name}`;
              const error = firstError(field.state.meta.errors);
              return (
                <FormField
                  id={id}
                  label={config.label}
                  required={config.required}
                  error={error}
                  className="gap-2.5 [&_label]:text-xs [&_label]:font-semibold [&_label]:text-ink"
                >
                  <input
                    id={id}
                    type={config.name === "phone" ? "tel" : "text"}
                    className={cn(fieldControlClassName, "h-[52px] px-3.5 text-[13px]")}
                    autoComplete={config.autoComplete}
                    placeholder={config.placeholder}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    {...invalidProps(id, error)}
                  />
                </FormField>
              );
            }}
          </form.Field>
        ))}
        {formError ? (
          <p
            role="alert"
            className="rounded-lg bg-expense-surface px-3.5 py-3 text-xs text-expense"
          >
            {formError}
          </p>
        ) : null}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(submitting) => (
            <ActionButton
              tone="brand"
              type="submit"
              pending={submitting}
              className="w-full sm:w-auto sm:min-w-[219px] sm:self-start"
            >
              Simpan pengaturan
            </ActionButton>
          )}
        </form.Subscribe>
      </form>
    </Panel>
  );
}
