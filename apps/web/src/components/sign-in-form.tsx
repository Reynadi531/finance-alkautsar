import { Button } from "@keuangan-alkautsar/ui/components/button";
import { Input } from "@keuangan-alkautsar/ui/components/input";
import { Label } from "@keuangan-alkautsar/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { CircleAlert, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import z from "zod";

import { authClient } from "@/lib/auth-client";

const inputClassName =
  "h-[50px] rounded-lg border-[#C9D7CF] bg-white px-4 text-sm text-[#13251B] placeholder:text-[#849088] focus-visible:border-[#166B4D] focus-visible:ring-2 focus-visible:ring-[#166B4D]/20 aria-invalid:border-[#B3463B] aria-invalid:ring-[#B3463B]/20 md:text-sm dark:bg-white dark:aria-invalid:border-[#B3463B] dark:aria-invalid:ring-[#B3463B]/20";

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
      className="flex flex-col gap-4"
    >
      {authError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg bg-[#FFF3F1] px-3.5 py-3 text-xs text-[#8E332E]"
        >
          <CircleAlert className="size-[18px] shrink-0 text-[#B3463B]" aria-hidden />
          <p className="pt-px leading-relaxed">{authError}</p>
        </div>
      ) : null}

      <form.Field name="email">
        {(field) => {
          const error = field.state.meta.errors[0]?.message;
          return (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name} className="text-[13px] font-bold text-[#263D30]">
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
                <p id={`${field.name}-error`} className="text-xs text-[#B3463B]">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name} className="text-[13px] font-bold text-[#263D30]">
                Kata sandi
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${field.name}-error` : undefined}
                className={inputClassName}
              />
              {error ? (
                <p id={`${field.name}-error`} className="text-xs text-[#B3463B]">
                  {error}
                </p>
              ) : null}
            </div>
          );
        }}
      </form.Field>

      <p className="text-xs text-[#517161]">Butuh bantuan masuk? Hubungi administrator masjid.</p>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-lg bg-[#166B4D] text-[15px] font-bold text-white hover:bg-[#125A40] focus-visible:ring-2 focus-visible:ring-[#166B4D]/40 focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Memproses…
              </>
            ) : authError ? (
              "Coba masuk lagi"
            ) : (
              "Masuk"
            )}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
