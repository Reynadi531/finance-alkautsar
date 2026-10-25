import { createFileRoute } from "@tanstack/react-router";

import {
  CategoryNoAccess,
  CategoryPage,
  CategoryPageSkeleton,
  DEFAULT_CATEGORY_STATUS,
} from "@/components/categories/category-page";
import { categorySearchSchema } from "@/components/categories/category-kinds";
import { PageError } from "@/components/page-layout";
import { getCategoryList } from "@/functions/categories";

export const Route = createFileRoute("/_auth/dashboard/tipe-pengeluaran")({
  validateSearch: categorySearchSchema,
  loaderDeps: ({ search }) => ({ status: search.status ?? DEFAULT_CATEGORY_STATUS, q: search.q }),
  loader: ({ context, deps }) =>
    context.shell.role === "admin" ? getCategoryList({ data: { kind: "expense", ...deps } }) : null,
  head: () => ({ meta: [{ title: "Tipe pengeluaran · ruangmasjid" }] }),
  component: ExpenseCategoriesPage,
  pendingComponent: () => <CategoryPageSkeleton kind="expense" />,
  errorComponent: () => <PageError title="Tipe transaksi gagal dimuat" />,
});

function ExpenseCategoriesPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  if (!data) return <CategoryNoAccess kind="expense" />;

  return (
    <CategoryPage
      kind="expense"
      data={data}
      search={search}
      onSearchChange={(next) => navigate({ search: next, replace: true })}
    />
  );
}
