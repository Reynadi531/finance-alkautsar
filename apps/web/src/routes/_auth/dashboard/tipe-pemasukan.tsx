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

export const Route = createFileRoute("/_auth/dashboard/tipe-pemasukan")({
  validateSearch: categorySearchSchema,
  loaderDeps: ({ search }) => ({ status: search.status ?? DEFAULT_CATEGORY_STATUS, q: search.q }),
  loader: ({ context, deps }) =>
    context.shell.role === "admin" ? getCategoryList({ data: { kind: "income", ...deps } }) : null,
  head: () => ({ meta: [{ title: "Tipe pemasukan · ruangmasjid" }] }),
  component: IncomeCategoriesPage,
  pendingComponent: () => <CategoryPageSkeleton kind="income" />,
  errorComponent: () => <PageError title="Tipe transaksi gagal dimuat" />,
});

function IncomeCategoriesPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  if (!data) return <CategoryNoAccess kind="income" />;

  return (
    <CategoryPage
      kind="income"
      data={data}
      search={search}
      onSearchChange={(next) => navigate({ search: next, replace: true })}
    />
  );
}
