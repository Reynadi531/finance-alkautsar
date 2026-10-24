import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@keuangan-alkautsar/ui/components/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserProfileMenu({
  name,
  email,
  roleLabel,
}: {
  name: string;
  email: string;
  roleLabel: string;
}) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-[10px] bg-brand-raised p-3 text-left outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/70">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[11px] font-bold text-brand"
        >
          {initials(name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate text-xs font-bold text-white">{name}</span>
          <span className="truncate text-[10px] text-brand-muted">{roleLabel}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-brand-muted" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="rounded-lg bg-white p-1 text-ink">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate text-ink-muted">{email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="rounded-md text-[13px]"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate({ to: "/login" });
                  },
                },
              });
            }}
          >
            <LogOut aria-hidden />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
