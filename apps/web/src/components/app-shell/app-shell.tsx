import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@keuangan-alkautsar/ui/components/sheet";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { MosqueIdentity } from "@/components/mosque-identity";

import { AppSidebar, type AppSidebarProps } from "./app-sidebar";

export function AppShell({
  children,
  ...sidebar
}: Omit<AppSidebarProps, "onNavigate"> & { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-svh bg-canvas lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh lg:block">
        <AppSidebar {...sidebar} />
      </aside>

      <header className="sticky top-0 z-30 flex flex-col gap-4 bg-brand p-5 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-[22px] font-bold tracking-[-0.7px] text-canvas">
            ruangmasjid
          </p>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className="flex size-12 items-center justify-center rounded-lg bg-white/[0.07] text-white outline-none hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Buka menu navigasi"
            >
              <Menu className="size-[22px]" aria-hidden />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] border-none bg-brand p-0 text-brand-foreground [&>[data-slot=sheet-close]]:top-7 [&>[data-slot=sheet-close]]:right-5 [&>[data-slot=sheet-close]]:text-white"
            >
              <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
              <AppSidebar {...sidebar} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
        <MosqueIdentity mosqueName={sidebar.mosqueName} />
      </header>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
