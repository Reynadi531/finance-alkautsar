import { createFileRoute } from "@tanstack/react-router";

import { transactionSearchSchema } from "@/components/transactions/model";
import {
  TransactionsError,
  TransactionsScreen,
  TransactionsSkeleton,
  loadTransactions,
  transactionLoaderDeps,
} from "@/components/transactions/transactions-screen";

export const Route = createFileRoute("/_auth/dashboard/transaksi/masuk")({
  validateSearch: transactionSearchSchema,
  loaderDeps: transactionLoaderDeps,
  loader: ({ deps }) => loadTransactions("income", deps),
  head: () => ({ meta: [{ title: "Uang Masuk · ruangmasjid" }] }),
  component: IncomePage,
  pendingComponent: TransactionsSkeleton,
  errorComponent: () => <TransactionsError kind="income" />,
});

function IncomePage() {
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
