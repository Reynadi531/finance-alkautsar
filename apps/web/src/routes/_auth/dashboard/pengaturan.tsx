import { Skeleton } from "@keuangan-alkautsar/ui/components/skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, History } from "lucide-react";

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
    <PageContainer>
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
        className="inline-flex items-center gap-1.5 self-start rounded-md text-[13px] font-semibold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary-action/40"
      >
        <History className="size-4" aria-hidden />
        Lihat riwayat perubahan pengaturan
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </PageContainer>
  );
}

function SettingsSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-label="Memuat pengaturan masjid">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-64 rounded-lg bg-white" />
        <Skeleton className="h-5 w-80 max-w-full rounded-lg bg-white" />
      </div>
      <Skeleton className="h-[520px] rounded-[10px] bg-white" />
      <Skeleton className="h-[200px] rounded-[10px] bg-white" />
      <Skeleton className="h-[180px] rounded-[10px] bg-white" />
    </PageContainer>
  );
}
