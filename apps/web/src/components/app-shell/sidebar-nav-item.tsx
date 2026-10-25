import { cn } from "@keuangan-alkautsar/ui/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";

import type { NavItem, NavSection } from "./navigation";

const itemClassName = cn(
  "flex w-full items-center gap-3 rounded-lg px-3 text-brand-foreground outline-none transition-colors",
  "focus-visible:ring-2 focus-visible:ring-white/70",
);

export function SidebarNavItem({
  item,
  size,
  onNavigate,
}: {
  item: NavItem;
  size: NavSection["size"];
  onNavigate?: () => void;
}) {
  const { icon: Icon, label, to, activePaths } = item;
  const pathname = useLocation({ select: (location) => location.pathname });
  const extraActive = activePaths?.some((prefix) => pathname.startsWith(prefix)) ?? false;
  const sizeClassName = size === "compact" ? "h-[39px] text-xs" : "h-[42px] text-[13px]";
  const iconClassName = size === "compact" ? "size-[15px]" : "size-[17px]";

  if (!to) {
    return (
      <span
        aria-disabled="true"
        title="Segera tersedia"
        className={cn(itemClassName, sizeClassName, "cursor-not-allowed opacity-60")}
      >
        <Icon className={cn(iconClassName, "shrink-0 text-brand-muted")} aria-hidden />
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
        sizeClassName,
        "hover:bg-white/10",
        "data-[status=active]:bg-white data-[status=active]:font-bold data-[status=active]:text-brand",
        "[&[data-status=active]_svg]:text-brand",
        extraActive && "bg-white font-bold text-brand [&_svg]:text-brand",
      )}
    >
      <Icon className={cn(iconClassName, "shrink-0 text-brand-muted")} aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}
