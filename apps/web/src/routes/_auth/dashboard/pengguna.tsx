import { Skeleton } from "@keuangan-alkautsar/ui/components/skeleton";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/action-button";
import { AppSelect } from "@/components/app-select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NoAccessPanel } from "@/components/no-access-panel";
import { PageContainer, PageError } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { TablePagination } from "@/components/table-pagination";
import {
  CreateUserDialog,
  EditUserDialog,
  ResetPasswordDialog,
} from "@/components/users/user-dialogs";
import { roleOptions } from "@/components/users/user-display";
import { RoleGuide, UserSummary } from "@/components/users/user-summary";
import { UsersTable, type UserAction } from "@/components/users/users-table";
import {
  listUsers,
  setUserActive,
  userListSearchSchema,
  USERS_PAGE_SIZE,
  type UserListSearch,
  type UserRow,
} from "@/functions/users";

const ALL = "all";

export const Route = createFileRoute("/_auth/dashboard/pengguna")({
  validateSearch: userListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.shell.role === "admin" ? listUsers({ data: deps }) : null,
  head: () => ({ meta: [{ title: "Pengguna · ruangmasjid" }] }),
  component: UsersPage,
  pendingComponent: UsersSkeleton,
  errorComponent: () => <PageError title="Daftar pengguna gagal dimuat" />,
});

function UsersPage() {
  const data = Route.useLoaderData();
  if (!data) return <NoAccessPanel title="Pengguna" />;
  return <UsersScreen data={data} />;
}

type Dialog = { action: UserAction; user: UserRow } | null;

function UsersScreen({ data }: { data: NonNullable<ReturnType<typeof Route.useLoaderData>> }) {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const { shell } = Route.useRouteContext();
  const [creating, setCreating] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pending, setPending] = useState(false);

  const updateSearch = useCallback(
    (changes: Partial<UserListSearch>) =>
      navigate({ search: (previous) => ({ ...previous, ...changes, page: changes.page }) }),
    [navigate],
  );
  const onSearch = useCallback(
    (q: string) => updateSearch({ q: q.trim() || undefined }),
    [updateSearch],
  );

  const page = data.page;
  const filtered = Boolean(search.q || search.role || search.status);
  const closeDialog = (open: boolean) => {
    if (!open) setDialog(null);
  };
  const target = (action: UserAction) => (dialog?.action === action ? dialog.user : null);
  const statusTarget =
    dialog && (dialog.action === "deactivate" || dialog.action === "activate") ? dialog : null;
  // Keep the confirm copy stable while the dialog animates closed.
  const lastStatus = useRef(statusTarget);
  if (statusTarget) lastStatus.current = statusTarget;
  const shownStatus = lastStatus.current;

  async function changeStatus() {
    if (!statusTarget) return;
    const active = statusTarget.action === "activate";
    setPending(true);
    try {
      await setUserActive({ data: { id: statusTarget.user.id, active } });
      toast.success(
        active
          ? `${statusTarget.user.name} dapat mengakses sistem kembali.`
          : `${statusTarget.user.name} telah dinonaktifkan.`,
      );
      setDialog(null);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status pengguna gagal diubah.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageContainer className="gap-5">
      <PageHeader
        title="Pengguna"
        description="Kelola akses tim yang membantu pencatatan keuangan masjid."
        action={
          <ActionButton tone="brand" onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            Tambah pengguna
          </ActionButton>
        }
      />

      <UserSummary stats={data.stats} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search.q ?? ""}
          onSearch={onSearch}
          placeholder="Cari nama atau email..."
          aria-label="Cari nama atau email pengguna"
          className="w-full sm:max-w-[390px] [&_input]:h-[47px]"
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <AppSelect
            variant="filter"
            aria-label="Filter peran"
            value={search.role ?? ALL}
            onValueChange={(value) =>
              updateSearch({ role: value === ALL ? undefined : (value as UserListSearch["role"]) })
            }
            options={[{ value: ALL, label: "Semua peran" }, ...roleOptions]}
          />
          <AppSelect
            variant="filter"
            aria-label="Filter status"
            value={search.status ?? ALL}
            onValueChange={(value) =>
              updateSearch({
                status: value === ALL ? undefined : (value as UserListSearch["status"]),
              })
            }
            options={[
              { value: ALL, label: "Semua status" },
              { value: "active", label: "Aktif" },
              { value: "inactive", label: "Nonaktif" },
            ]}
          />
        </div>
      </div>

      <section aria-label="Daftar pengguna" className="rounded-xl bg-white px-4 pt-5 pb-1 sm:px-5">
        <UsersTable
          users={data.users}
          currentUserId={data.currentUserId}
          filtered={filtered}
          onAction={(action, user) => setDialog({ action, user })}
        />
        <TablePagination
          className="border-t border-line px-2 pb-3"
          page={page}
          pageSize={USERS_PAGE_SIZE}
          total={data.total}
          noun="pengguna"
          onPageChange={(next) => updateSearch({ page: next > 1 ? next : undefined })}
        />
      </section>

      <RoleGuide />

      <CreateUserDialog open={creating} onOpenChange={setCreating} mosqueName={shell.mosqueName} />
      <EditUserDialog
        target={target("edit")}
        isSelf={dialog?.user.id === data.currentUserId}
        onOpenChange={closeDialog}
      />
      <ResetPasswordDialog
        target={target("reset-password")}
        isSelf={dialog?.user.id === data.currentUserId}
        onOpenChange={closeDialog}
      />
      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setDialog(null);
        }}
        tone={shownStatus?.action === "activate" ? "brand" : "expense"}
        title={shownStatus?.action === "activate" ? "Aktifkan pengguna?" : "Nonaktifkan pengguna?"}
        description={
          shownStatus?.action === "activate"
            ? `${shownStatus.user.name} (${shownStatus.user.email}) dapat masuk dan mengakses sistem kembali sesuai perannya.`
            : `${shownStatus?.user.name} (${shownStatus?.user.email}) akan dikeluarkan dari semua perangkat dan tidak dapat masuk lagi. Riwayat transaksinya tetap tersimpan.`
        }
        confirmLabel={shownStatus?.action === "activate" ? "Aktifkan" : "Nonaktifkan"}
        onConfirm={changeStatus}
        pending={pending}
      />
    </PageContainer>
  );
}

function UsersSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-label="Memuat daftar pengguna">
      <Skeleton className="h-9 w-48 rounded-lg bg-white" />
      <Skeleton className="h-5 w-96 max-w-full rounded-lg bg-white" />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[79px] rounded-[10px] bg-white" />
        ))}
      </div>
      <Skeleton className="h-[47px] w-full max-w-[390px] rounded-lg bg-white" />
      <Skeleton className="h-[420px] rounded-xl bg-white" />
    </PageContainer>
  );
}
