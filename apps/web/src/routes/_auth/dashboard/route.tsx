import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";

import { ActionButton } from "@/components/action-button";
import { AppShell } from "@/components/app-shell/app-shell";
import { getAppShell } from "@/functions/mosque";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/dashboard")({
  beforeLoad: async () => {
    const shell = await getAppShell();
    return { shell };
  },
  component: AppLayout,
});

function AppLayout() {
  const { shell } = Route.useRouteContext();

  if (!shell.role) {
    return <NoAccess email={shell.user.email} mosqueName={shell.mosqueName} />;
  }

  return (
    <AppShell user={shell.user} mosqueName={shell.mosqueName} role={shell.role}>
      <Outlet />
    </AppShell>
  );
}

function NoAccess({ email, mosqueName }: { email: string; mosqueName: string }) {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas px-4">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-[10px] border border-line bg-white p-8 shadow-card">
        <p className="font-display text-xl font-bold tracking-[-0.7px] text-brand">ruangmasjid</p>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.8px] text-ink">
            Belum ada akses
          </h1>
          <p className="text-sm text-ink-muted">
            Akun {email} belum memiliki peran di {mosqueName}. Minta administrator menambahkan akun
            ini sebagai pengurus.
          </p>
        </div>
        <ActionButton
          tone="outline"
          className="self-start"
          onClick={() =>
            authClient.signOut({
              fetchOptions: { onSuccess: () => navigate({ to: "/login" }) },
            })
          }
        >
          Keluar
        </ActionButton>
      </div>
    </main>
  );
}
