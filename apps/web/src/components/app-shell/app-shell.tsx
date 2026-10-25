import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@keuangan-alkautsar/ui/components/sheet";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AppSidebar, type AppSidebarProps } from "./app-sidebar";

export function AppShell({
  children,
  ...sidebar
}: Omit<AppSidebarProps, "onNavigate"> & { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-svh bg-canvas lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh lg:block">
        <AppSidebar {...sidebar} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-brand px-4 py-3 lg:hidden">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-white">ruangmasjid</p>
          <p className="truncate text-xs text-brand-muted">{sidebar.mosqueName}</p>
        </div>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            className="flex size-10 items-center justify-center rounded-lg text-white outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Buka menu navigasi"
          >
            <Menu className="size-5" aria-hidden />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] border-none bg-brand p-0 text-brand-foreground [&>[data-slot=sheet-close]]:text-white"
          >
            <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
            <AppSidebar {...sidebar} onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
