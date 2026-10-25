import { cn } from "@keuangan-alkautsar/ui/lib/utils";

import { roleLabels } from "@/components/app-shell/navigation";
import { StatusBadge, type BadgeTone } from "@/components/status-badge";
import type { UserRole } from "@/server/mosque";

export const roleOptions = (Object.keys(roleLabels) as UserRole[]).map((value) => ({
  value,
  label: roleLabels[value],
}));

const roleTone: Record<UserRole, BadgeTone> = {
  admin: "brand",
  treasurer: "income",
  viewer: "neutral",
};

// Avatar tints from the S07 design; no theme tokens exist for these pastel swatches.
const avatarTints = [
  "bg-[#DDEBFA]",
  "bg-[#E5EFE8]",
  "bg-[#F6E9DC]",
  "bg-[#E8E6F4]",
  "bg-[#EDF0F2]",
  "bg-[#F4E6EA]",
] as const;

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((part) => /\p{L}/u.test(part))
    .slice(0, 2)
    .map((part) => part.match(/\p{L}/u)?.[0]?.toUpperCase() ?? "")
    .join("");
}

function tintFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return avatarTints[hash % avatarTints.length];
}

/** Round initials badge tinted per user so rows are easy to tell apart. */
export function UserAvatar({ id, name }: { id: string; name: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-[34px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#29465E]",
        tintFor(id),
      )}
    >
      {initials(name)}
    </span>
  );
}

export function RoleBadge({ role }: { role: UserRole | null }) {
  if (!role) return <StatusBadge tone="neutral">Tanpa peran</StatusBadge>;
  return (
    <StatusBadge tone={roleTone[role]} className="font-medium">
      {roleLabels[role]}
    </StatusBadge>
  );
}

export function UserStatusBadge({ active }: { active: boolean }) {
  return active ? (
    <StatusBadge tone="income" dot="filled" className="font-medium">
      Aktif
    </StatusBadge>
  ) : (
    <StatusBadge tone="neutral" dot="hollow" className="font-medium">
      Nonaktif
    </StatusBadge>
  );
}

const TIME_ZONE = "Asia/Jakarta";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const clock = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TIME_ZONE,
});
const shortDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

/** "Hari ini, 09.42", "Kemarin, 16.30", otherwise "29 Okt 2026" (WIB). */
export function formatLastActive(iso: string | null, now = new Date()) {
  if (!iso) return "Belum pernah";
  const date = new Date(iso);
  const time = clock.format(date).replace(":", ".");
  const day = dayKey.format(date);
  if (day === dayKey.format(now)) return `Hari ini, ${time}`;
  if (day === dayKey.format(new Date(now.getTime() - 86_400_000))) return `Kemarin, ${time}`;
  return shortDate.format(date).replace(".", "");
}
