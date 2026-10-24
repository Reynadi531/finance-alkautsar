import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@keuangan-alkautsar/ui/components/dropdown-menu";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { setActiveMosque } from "@/functions/mosque";
import type { Membership } from "@/server/mosque-access";

export function MosqueSwitcher({
  memberships,
  activeId,
}: {
  memberships: Membership[];
  activeId: string;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const active = memberships.find((membership) => membership.mosqueId === activeId);

  if (memberships.length <= 1) {
    return <p className="text-xs text-brand-muted">{active?.mosqueName}</p>;
  }

  async function select(mosqueId: string) {
    if (mosqueId === activeId) return;
    setPending(true);
    try {
      await setActiveMosque({ data: { mosqueId } });
      // Filters belong to the previous mosque's view, so start from a clean dashboard.
      await navigate({ to: "/dashboard", search: {} });
      await router.invalidate();
    } catch {
      toast.error("Tidak dapat mengganti masjid. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="-mx-1 flex items-center gap-1 rounded px-1 text-left text-xs text-brand-muted outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-60"
        aria-label={`Masjid aktif: ${active?.mosqueName}. Ganti masjid`}
      >
        <span className="truncate">{active?.mosqueName}</span>
        <ChevronDown className="size-3.5 shrink-0" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60 rounded-lg bg-white p-1 text-ink">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-ink-muted">Pilih masjid</DropdownMenuLabel>
          {memberships.map((membership) => (
            <DropdownMenuItem
              key={membership.mosqueId}
              onClick={() => select(membership.mosqueId)}
              className="rounded-md text-[13px]"
            >
              <span className="flex-1 truncate">{membership.mosqueName}</span>
              {membership.mosqueId === activeId ? (
                <Check className="text-income" aria-label="Aktif" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
