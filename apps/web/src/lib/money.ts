const rupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** Formats integer rupiah as "Rp 18.450.000". */
export function formatRupiah(amount: number) {
  const sign = amount < 0 ? "−" : "";
  return `${sign}Rp ${rupiah.format(Math.abs(amount))}`;
}
