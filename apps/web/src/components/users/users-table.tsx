import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@keuangan-alkautsar/ui/components/dropdown-menu";
import { KeyRound, MoreHorizontal, Pencil, UserCheck, UserX } from "lucide-react";

import { DataTable, TableMessage, Td, Th, Tr } from "@/components/data-table";
import {
  formatLastActive,
  RoleBadge,
  UserAvatar,
  UserStatusBadge,
} from "@/components/users/user-display";
import type { UserRow } from "@/functions/users";

export type UserAction = "edit" | "reset-password" | "deactivate" | "activate";

const COLUMNS = 6;

/** S07 user list. Row actions open dialogs owned by the page. */
export function UsersTable({
  users,
  currentUserId,
  filtered,
  onAction,
}: {
  users: readonly UserRow[];
  currentUserId: string;
  filtered: boolean;
  onAction: (action: UserAction, user: UserRow) => void;
}) {
  return (
    <DataTable className="min-w-[860px]">
      <caption className="sr-only">Daftar pengguna</caption>
      <thead>
        <tr>
          <Th className="w-[25%] pl-2">Pengguna</Th>
          <Th className="w-[23%]">Email</Th>
          <Th className="w-[15%]">Peran</Th>
          <Th className="w-[12%]">Status</Th>
          <Th className="w-[15%]">Terakhir aktif</Th>
          <Th className="w-[10%]">Aksi</Th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <TableMessage colSpan={COLUMNS}>
            {filtered
              ? "Tidak ada pengguna yang cocok dengan pencarian atau filter."
              : "Belum ada pengguna. Tambahkan anggota tim untuk mulai berbagi akses."}
          </TableMessage>
        ) : (
          users.map((row) => (
            <Tr key={row.id}>
              <Td className="py-[17px] pl-2">
                <div className="flex items-center gap-[11px]">
                  <UserAvatar id={row.id} name={row.name} />
                  <span className="min-w-0 truncate text-xs font-bold text-ink">
                    {row.name}
                    {row.id === currentUserId ? (
                      <span className="ml-1.5 font-normal text-ink-muted">(Anda)</span>
                    ) : null}
                  </span>
                </div>
              </Td>
              <Td className="text-xs break-all text-ink-body">{row.email}</Td>
              <Td>
                <RoleBadge role={row.role} />
              </Td>
              <Td>
                <UserStatusBadge active={row.active} />
              </Td>
              <Td className="text-[11px] whitespace-nowrap text-ink-muted">
                {formatLastActive(row.lastActiveAt)}
              </Td>
              <Td>
                <RowActions
                  user={row}
                  isSelf={row.id === currentUserId}
                  onAction={(action) => onAction(action, row)}
                />
              </Td>
            </Tr>
          ))
        )}
      </tbody>
    </DataTable>
  );
}

function RowActions({
  user,
  isSelf,
  onAction,
}: {
  user: UserRow;
  isSelf: boolean;
  onAction: (action: UserAction) => void;
}) {
  const itemClassName = "rounded-md px-2.5 py-2 text-[13px] text-ink";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Aksi untuk ${user.name}`}
        className="flex h-8 w-10 items-center justify-center rounded-md text-ink-body outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand/30 data-popup-open:bg-canvas"
      >
        <MoreHorizontal className="size-5" strokeWidth={2.5} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-lg bg-white p-1 text-ink">
        <DropdownMenuItem className={itemClassName} onClick={() => onAction("edit")}>
          <Pencil aria-hidden />
          Ubah
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClassName} onClick={() => onAction("reset-password")}>
          <KeyRound aria-hidden />
          Atur ulang kata sandi
        </DropdownMenuItem>
        {isSelf ? null : (
          <>
            <DropdownMenuSeparator />
            {user.deactivatedAt ? (
              <DropdownMenuItem className={itemClassName} onClick={() => onAction("activate")}>
                <UserCheck aria-hidden />
                Aktifkan
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant="destructive"
                className="rounded-md px-2.5 py-2 text-[13px]"
                onClick={() => onAction("deactivate")}
              >
                <UserX aria-hidden />
                Nonaktifkan
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
