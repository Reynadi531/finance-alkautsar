import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@keuangan-alkautsar/ui/components/dropdown-menu";
import { Ellipsis, KeyRound, Pencil, UserCheck, UserX } from "lucide-react";
import type { ReactNode } from "react";

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
  const emptyMessage = filtered
    ? "Tidak ada pengguna yang cocok dengan pencarian atau filter."
    : "Belum ada pengguna. Tambahkan anggota tim untuk mulai berbagi akses.";

  return (
    <>
      <div className="hidden md:block">
        <DataTable className="min-w-[860px]">
          <caption className="sr-only">Daftar pengguna</caption>
          <thead>
            <tr>
              <Th className="w-[25%] pl-4">Pengguna</Th>
              <Th className="w-[23%]">Email</Th>
              <Th className="w-[15%]">Peran</Th>
              <Th className="w-[12%]">Status</Th>
              <Th className="w-[15%]">Terakhir aktif</Th>
              <Th className="w-[10%]">Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <TableMessage colSpan={COLUMNS}>{emptyMessage}</TableMessage>
            ) : (
              users.map((row) => (
                <Tr key={row.id}>
                  <Td className="py-4 pl-4">
                    <div className="flex items-center gap-[11px]">
                      <UserAvatar id={row.id} name={row.name} />
                      <span className="min-w-0 truncate text-xs font-semibold text-ink">
                        {row.name}
                        {row.id === currentUserId ? (
                          <span className="ml-1.5 font-normal text-ink-muted">(Anda)</span>
                        ) : null}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-xs break-all text-ink">{row.email}</Td>
                  <Td>
                    <RoleBadge role={row.role} />
                  </Td>
                  <Td>
                    <UserStatusBadge active={row.active} />
                  </Td>
                  <Td className="text-xs whitespace-nowrap text-ink">
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
      </div>

      <ul aria-label="Daftar pengguna" className="flex flex-col md:hidden">
        {users.length === 0 ? (
          <li className="py-12 text-center text-[13px] leading-[23px] text-ink-muted">
            {emptyMessage}
          </li>
        ) : (
          users.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-4 border-b border-line py-4 first:pt-0 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-[11px]">
                  <UserAvatar id={row.id} name={row.name} />
                  <span className="min-w-0 truncate text-[13px] font-semibold text-ink">
                    {row.name}
                    {row.id === currentUserId ? (
                      <span className="ml-1.5 font-normal text-ink-muted">(Anda)</span>
                    ) : null}
                  </span>
                </div>
                <RowActions
                  user={row}
                  isSelf={row.id === currentUserId}
                  onAction={(action) => onAction(action, row)}
                />
              </div>
              <dl className="flex flex-col gap-4">
                <MobileField label="Email">
                  <span className="text-[13px] leading-[22px] break-all text-ink">{row.email}</span>
                </MobileField>
                <MobileField label="Peran">
                  <RoleBadge role={row.role} />
                </MobileField>
                <MobileField label="Status">
                  <UserStatusBadge active={row.active} />
                </MobileField>
                <MobileField label="Terakhir aktif">
                  <span className="text-[13px] leading-[22px] text-ink">
                    {formatLastActive(row.lastActiveAt)}
                  </span>
                </MobileField>
              </dl>
            </li>
          ))
        )}
      </ul>
    </>
  );
}

function MobileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <dt className="text-[10px] text-ink-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
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
        className="flex size-10 items-center justify-center rounded-lg text-ink outline-none hover:bg-muted-surface focus-visible:ring-2 focus-visible:ring-primary-action/30 data-popup-open:bg-muted-surface"
      >
        <Ellipsis className="size-5" aria-hidden />
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
