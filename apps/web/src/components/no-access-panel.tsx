import { ShieldAlert } from "lucide-react";

import { PageContainer } from "@/components/page-layout";

/**
 * Shown in place of a screen the signed-in role may not open (direct URL access).
 * The server functions behind the screen enforce the same rule.
 */
export function NoAccessPanel({
  title,
  message = "Halaman ini hanya dapat dibuka oleh administrator masjid.",
}: {
  title: string;
  message?: string;
}) {
  return (
    <PageContainer>
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-white p-6">
        <span className="flex size-10 items-center justify-center rounded-full bg-info-surface text-brand">
          <ShieldAlert className="size-5" aria-hidden />
        </span>
        <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
        <p className="text-sm text-ink-muted">{message}</p>
      </div>
    </PageContainer>
  );
}
