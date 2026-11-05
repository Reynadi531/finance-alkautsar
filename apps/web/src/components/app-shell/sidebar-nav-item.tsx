import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";

import type { NavItem } from "./navigation";

const itemClassName = cn(
  "flex h-12 w-full items-center gap-3 rounded-lg px-3 text-[13px] text-brand-foreground outline-none transition-colors",
  "focus-visible:ring-2 focus-visible:ring-white/70",
);

const activeClassName = "bg-brand-tint font-semibold text-brand [&_svg]:text-brand";

export function SidebarNavItem({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { icon: Icon, label, to, activePaths } = item;
  const pathname = useLocation({ select: (location) => location.pathname });
  const extraActive = activePaths?.some((prefix) => pathname.startsWith(prefix)) ?? false;

  if (!to) {
    return (
      <span
        aria-disabled="true"
        title="Segera tersedia"
        className={cn(itemClassName, "cursor-not-allowed opacity-60")}
      >
        <Icon className="size-5 shrink-0 text-brand-icon" aria-hidden />
        <span className="truncate">{label}</span>
        <span className="sr-only">(segera tersedia)</span>
      </span>
    );
  }

  return (
    <Link
      to={to}
      activeOptions={{ exact: true, includeSearch: false }}
      aria-current={extraActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        itemClassName,
        "hover:bg-white/[0.07]",
        "data-[status=active]:bg-brand-tint data-[status=active]:font-semibold data-[status=active]:text-brand",
        "[&[data-status=active]_svg]:text-brand",
        extraActive && activeClassName,
      )}
    >
      <Icon className="size-5 shrink-0 text-brand-icon" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}
