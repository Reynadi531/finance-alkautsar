import { Input } from "@keuangan-alkautsar/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@keuangan-alkautsar/ui/components/input-group";
import { Label } from "@keuangan-alkautsar/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CircleAlert, Eye, EyeOff } from "lucide-react";
import { useRef, useState } from "react";
import z from "zod";

import { ActionButton } from "@/components/action-button";
import { authClient } from "@/lib/auth-client";

const inputClassName =
  "h-[52px] rounded-lg border-field bg-action px-4 text-[13px] text-ink placeholder:text-ink-subtle focus-visible:border-ink-strong focus-visible:ring-2 focus-visible:ring-ink-strong/20 aria-invalid:border-expense aria-invalid:ring-expense/20 md:text-[13px] dark:bg-action dark:aria-invalid:border-expense dark:aria-invalid:ring-expense/20";

function getSignInErrorMessage(status: number) {
  // Same message for unknown email and wrong password, so account existence is not revealed.
  if (status === 401 || status === 400) {
    return "Email atau kata sandi tidak cocok. Coba lagi.";
  }
  if (status === 429) {
    return "Terlalu banyak percobaan masuk. Tunggu sebentar, lalu coba lagi.";
  }
  return "Tidak dapat masuk saat ini. Periksa koneksi Anda, lalu coba lagi.";
}

export default function SignInForm() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setAuthError(null);
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/dashboard",
            });
          },
          onError: (error) => {
            setAuthError(getSignInErrorMessage(error.error.status));
          },
        },
      );
    },
    onSubmitInvalid: () => {
      formRef.current?.querySelector<HTMLInputElement>("[aria-invalid='true']")?.focus();
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Masukkan alamat email yang valid."),
        password: z.string().min(1, "Kata sandi wajib diisi."),
      }),
    },
  });

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-5"
    >
      {authError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg bg-expense-surface px-3.5 py-3 text-xs text-expense-hover"
        >
          <CircleAlert className="size-[18px] shrink-0 text-expense" aria-hidden />
          <p className="pt-px leading-relaxed">{authError}</p>
        </div>
      ) : null}

      <form.Field name="email">
        {(field) => {
          const error = field.state.meta.errors[0]?.message;
          return (
            <div className="flex flex-col gap-[9px]">
              <Label htmlFor={field.name} className="text-xs font-semibold text-ink">
                Email
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${field.name}-error` : undefined}
                className={inputClassName}
              />
              {error ? (
                <p id={`${field.name}-error`} className="text-xs text-expense">
                  {error}
                </p>
              ) : null}
            </div>
          );
        }}
      </form.Field>

      <form.Field name="password">
        {(field) => {
          const error = field.state.meta.errors[0]?.message;
          return (
            <div className="flex flex-col gap-[9px]">
              <Label htmlFor={field.name} className="text-xs font-semibold text-ink">
                Kata sandi
              </Label>
              <InputGroup className="h-[52px] rounded-lg border-field bg-action has-[[data-slot=input-group-control]:focus-visible]:border-ink-strong has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ink-strong/20 has-[[data-slot][aria-invalid=true]]:border-expense has-[[data-slot][aria-invalid=true]]:ring-expense/20 dark:bg-action">
                <InputGroupInput
                  id={field.name}
                  name={field.name}
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  spellCheck={false}
                  placeholder="Masukkan kata sandi"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${field.name}-error` : undefined}
                  className="h-full px-4 text-[13px] text-ink placeholder:text-ink-subtle md:text-[13px]"
                />
                <InputGroupAddon align="inline-end" className="pr-2">
                  <InputGroupButton
                    size="icon-sm"
                    aria-label={passwordVisible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    className="rounded-md text-ink-body"
                  >
                    {passwordVisible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {error ? (
                <p id={`${field.name}-error`} className="text-xs text-expense">
                  {error}
                </p>
              ) : null}
            </div>
          );
        }}
      </form.Field>

      <p className="text-[11px] leading-[19px] text-ink-lead">
        Butuh bantuan masuk? Hubungi administrator masjid.
      </p>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <ActionButton
            type="submit"
            tone="brand"
            pending={isSubmitting}
            className="h-[54px] w-full text-sm font-bold text-canvas lg:h-[52px]"
          >
            {isSubmitting ? (
              "Memproses…"
            ) : (
              <>
                {authError ? "Coba masuk lagi" : "Masuk"}
                <ArrowRight aria-hidden />
              </>
            )}
          </ActionButton>
        )}
      </form.Subscribe>
    </form>
  );
}
