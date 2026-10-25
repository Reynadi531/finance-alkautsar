import { Skeleton } from "@keuangan-alkautsar/ui/components/skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock3 } from "lucide-react";

import { NoAccessPanel } from "@/components/no-access-panel";
import { PageContainer, PageError } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { LoginBackgroundPanel } from "@/components/settings/login-background-panel";
import { ProfilePanel } from "@/components/settings/profile-panel";
import { PublicReportPanel } from "@/components/settings/public-report-panel";
import { getMosqueSettings } from "@/functions/settings";

export const Route = createFileRoute("/_auth/dashboard/pengaturan")({
  loader: ({ context }) => (context.shell.role === "admin" ? getMosqueSettings() : null),
  head: () => ({ meta: [{ title: "Pengaturan masjid · ruangmasjid" }] }),
  component: SettingsPage,
  pendingComponent: SettingsSkeleton,
  errorComponent: () => <PageError title="Pengaturan gagal dimuat" />,
});

function SettingsPage() {
  const settings = Route.useLoaderData();
  if (!settings) return <NoAccessPanel title="Pengaturan masjid" />;

  return (
    <PageContainer className="gap-[18px] lg:px-[54px] lg:py-8">
      <div className="flex w-full max-w-[850px] flex-col gap-[18px]">
        <PageHeader
          title="Pengaturan masjid"
          description={`Kelola identitas dan preferensi ${settings.name}.`}
        />
        <ProfilePanel settings={settings} />
        <LoginBackgroundPanel background={settings.loginBackground} />
        <PublicReportPanel enabled={settings.publicReportEnabled} />
        <Link
          to="/dashboard/change-log"
          search={{ entity: "mosque" }}
          className="inline-flex items-center gap-1.5 self-start rounded-md text-[13px] font-bold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-income/40"
        >
          <Clock3 className="size-3.5" aria-hidden />
          Lihat riwayat perubahan pengaturan
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </PageContainer>
  );
}

function SettingsSkeleton() {
  return (
    <PageContainer
      aria-busy="true"
      aria-label="Memuat pengaturan masjid"
      className="lg:px-[54px] lg:py-8"
    >
      <div className="flex w-full max-w-[850px] flex-col gap-[18px]">
        <Skeleton className="h-9 w-64 rounded-lg bg-white" />
        <Skeleton className="h-5 w-80 max-w-full rounded-lg bg-white" />
        <Skeleton className="h-[357px] rounded-xl bg-white" />
        <Skeleton className="h-[156px] rounded-xl bg-white" />
        <Skeleton className="h-[165px] rounded-xl bg-white" />
      </div>
    </PageContainer>
  );
}
