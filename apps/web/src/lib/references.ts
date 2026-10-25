const transactionPrefix = { income: "MSK", expense: "KLR" } as const;

/** Human transaction reference, e.g. "MSK-2026-0042" for income recorded in 2026. */
export function transactionRef(kind: "income" | "expense", number: number, effectiveDate: string) {
  return `${transactionPrefix[kind]}-${effectiveDate.slice(0, 4)}-${String(number).padStart(4, "0")}`;
}

export const transactionKindLabels = { income: "Pemasukan", expense: "Pengeluaran" } as const;
