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

  if (!shell.active) {
    return <NoMosqueAccess email={shell.user.email} />;
  }

  return (
    <AppShell user={shell.user} memberships={shell.memberships} active={shell.active}>
      <Outlet />
    </AppShell>
  );
}

function NoMosqueAccess({ email }: { email: string }) {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas px-4">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-xl bg-white p-8">
        <p className="font-display text-xl font-bold text-brand">ruangmasjid</p>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-bold text-ink">Belum ada akses masjid</h1>
          <p className="text-sm text-ink-muted">
            Akun {email} belum terdaftar di masjid mana pun. Minta administrator masjid menambahkan
            akun ini sebagai pengurus.
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
