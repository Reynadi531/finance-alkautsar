import { createFileRoute } from "@tanstack/react-router";

import { transactionSearchSchema } from "@/components/transactions/model";
import {
  TransactionsError,
  TransactionsScreen,
  TransactionsSkeleton,
  loadTransactions,
  transactionLoaderDeps,
} from "@/components/transactions/transactions-screen";

export const Route = createFileRoute("/_auth/dashboard/transaksi/keluar")({
  validateSearch: transactionSearchSchema,
  loaderDeps: transactionLoaderDeps,
  loader: ({ deps }) => loadTransactions("expense", deps),
  head: () => ({ meta: [{ title: "Uang Keluar · ruangmasjid" }] }),
  component: ExpensePage,
  pendingComponent: TransactionsSkeleton,
  errorComponent: () => <TransactionsError kind="expense" />,
});

function ExpensePage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { shell } = Route.useRouteContext();
  return (
    <TransactionsScreen
      data={data}
      search={search}
      mosqueName={shell.mosqueName}
      onSearchChange={(patch, options) =>
        navigate({ search: (previous) => ({ ...previous, ...patch }), replace: options?.replace })
      }
    />
  );
}
