import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";

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
      <div className="flex w-full max-w-md flex-col gap-5 rounded-xl bg-white p-8">
        <p className="font-display text-xl font-bold text-brand">ruangmasjid</p>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-bold text-ink">Belum ada akses</h1>
          <p className="text-sm text-ink-muted">
            Akun {email} belum memiliki peran di {mosqueName}. Minta administrator menambahkan akun
            ini sebagai pengurus.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            authClient.signOut({ fetchOptions: { onSuccess: () => navigate({ to: "/login" }) } })
          }
          className="self-start rounded-lg bg-action px-4 py-2 text-[13px] font-bold text-action-foreground hover:bg-action-hover"
        >
          Keluar
        </button>
      </div>
    </main>
  );
}
