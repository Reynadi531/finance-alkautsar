import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { useRouter } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { ActionButton } from "@/components/action-button";

/** Content column for every screen inside the app shell. */
export function PageContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-6 px-4 py-6 sm:px-8 lg:px-11 lg:py-[38px]", className)}
      {...props}
    />
  );
}

/** Route `errorComponent` body: explains the failure and retries the loader. */
export function PageError({
  title = "Data gagal dimuat",
  message = "Data tidak dapat diambil. Periksa koneksi Anda, lalu coba lagi.",
}: {
  title?: string;
  message?: string;
}) {
  const router = useRouter();
  return (
    <PageContainer>
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-white p-6">
        <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
        <p className="text-sm text-ink-muted">{message}</p>
        <ActionButton tone="brand" onClick={() => router.invalidate()}>
          Coba lagi
        </ActionButton>
      </div>
    </PageContainer>
  );
}
