import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";

import { reportKindLabels, type ReportFormat } from "@/components/report/report-query";
import { formatLongDate, formatRange, formatTableDate, formatTimestamp } from "@/lib/date-range";
import { formatRupiah } from "@/lib/money";
import type { CashReport } from "@/server/report";

export type ExportOptions = {
  /** Include the opening-balance row, the running-balance column, and the closing row. */
  running: boolean;
  exportedBy: string;
  exportedAt: Date;
};

/** Everything both formats print, derived once from the shared ledger computation. */
function describe(report: CashReport, options: ExportOptions) {
  const { query } = report;
  const showIncome = query.kind !== "expense";
  const showExpense = query.kind !== "income";
  return {
    title: "Laporan Kas",
    period: `${formatRange(query)} (${query.from} s.d. ${query.to})`,
    scope: reportKindLabels[query.kind],
    exported: `${formatTimestamp(options.exportedAt)} WIB oleh ${options.exportedBy}`,
    summary: [
      ...(options.running
        ? [
            {
              label: "Saldo awal",
              caption: `Per ${formatLongDate(query.from)}`,
              value: report.openingBalance,
            },
          ]
        : []),
      {
        label: "Pemasukan",
        caption: `${report.incomeCount} transaksi masuk`,
        value: report.income,
      },
      {
        label: "Pengeluaran",
        caption: `${report.expenseCount} transaksi keluar`,
        value: report.expense,
      },
      options.running
        ? {
            label: "Saldo akhir",
            caption: `Per ${formatLongDate(query.to)}`,
            value: report.closingBalance,
          }
        : {
            label: "Selisih periode",
            caption: "Pemasukan − pengeluaran",
            value: report.income - report.expense,
          },
    ],
    showIncome,
    showExpense,
    totalLabel: options.running ? "Saldo akhir periode" : "Total periode",
    notes: [
      "Saldo akhir dihitung dari saldo awal ditambah pemasukan, dikurangi pengeluaran. Laporan ini hanya mencakup transaksi yang tercatat.",
      ...(query.kind !== "all" && options.running
        ? [
            `Cakupan hanya ${reportKindLabels[query.kind].toLowerCase()}; saldo berjalan tetap menghitung seluruh transaksi kas.`,
          ]
        : []),
    ],
  };
}

function isoToUtcDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}

const rupiahFormat = '"Rp "#,##0;"−Rp "#,##0';

async function renderXlsx(report: CashReport, options: ExportOptions) {
  const { default: ExcelJS } = await import("exceljs");
  const info = describe(report, options);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = options.exportedBy;
  workbook.created = options.exportedAt;
  workbook.title = `${info.title} ${report.mosqueName}`;

  const sheet = workbook.addWorksheet("Laporan Kas", {
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });
  sheet.columns = [
    { key: "date", width: 14 },
    { key: "ref", width: 16 },
    { key: "label", width: 40 },
    { key: "category", width: 22 },
    { key: "income", width: 18 },
    { key: "expense", width: 18 },
    ...(options.running ? [{ key: "balance", width: 18 }] : []),
  ];
  const lastColumn = options.running ? 7 : 6;

  sheet.addRow([info.title]).font = { bold: true, size: 16 };
  sheet.addRow([report.mosqueName]).font = { bold: true, size: 12 };
  sheet.addRow([`Periode: ${info.period}`]);
  sheet.addRow([`Cakupan data: ${info.scope}`]);
  sheet.addRow([`Diekspor: ${info.exported}`]).font = { color: { argb: "FF69766F" } };
  sheet.addRow([]);

  sheet.addRow(["Ringkasan"]).font = { bold: true };
  for (const item of info.summary) {
    const row = sheet.addRow([`${item.label} (${item.caption})`]);
    sheet.mergeCells(row.number, 1, row.number, 3);
    const cell = row.getCell(4);
    cell.value = item.value;
    cell.numFmt = rupiahFormat;
    cell.font = { bold: true };
  }
  sheet.addRow([]);

  const header = sheet.addRow([
    "Tanggal",
    "No. Referensi",
    "Keterangan",
    "Kategori",
    "Pemasukan",
    "Pengeluaran",
    ...(options.running ? ["Saldo"] : []),
  ]);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003C91" } };
  });
  const headerRowNumber = header.number;

  const addLedgerRow = (values: {
    date: string;
    ref?: string;
    label: string;
    category?: string;
    income?: number | null;
    expense?: number | null;
    balance?: number;
    bold?: boolean;
  }) => {
    const row = sheet.addRow({
      date: isoToUtcDate(values.date),
      ref: values.ref ?? "",
      label: values.label,
      category: values.category ?? "",
      income: values.income ?? null,
      expense: values.expense ?? null,
      ...(options.running ? { balance: values.balance ?? null } : {}),
    });
    row.getCell("date").numFmt = "[$-421]dd mmm yyyy";
    for (const key of ["income", "expense", ...(options.running ? ["balance"] : [])]) {
      row.getCell(key).numFmt = rupiahFormat;
    }
    if (values.bold) row.font = { bold: true };
    return row;
  };

  if (options.running) {
    addLedgerRow({
      date: report.query.from,
      label: "Saldo awal periode",
      balance: report.openingBalance,
      bold: true,
    });
  }
  for (const row of report.rows) {
    addLedgerRow({
      date: row.effectiveDate,
      ref: row.ref,
      label: row.label,
      category: row.categoryName,
      income: row.kind === "income" ? row.amount : null,
      expense: row.kind === "expense" ? row.amount : null,
      balance: row.balance,
    });
  }
  if (report.rows.length === 0) {
    const row = sheet.addRow(["", "", "Tidak ada transaksi yang cocok pada periode ini."]);
    row.font = { italic: true, color: { argb: "FF69766F" } };
  }
  const total = addLedgerRow({
    date: report.query.to,
    label: info.totalLabel,
    income: info.showIncome ? report.shownIncome : null,
    expense: info.showExpense ? report.shownExpense : null,
    balance: report.closingBalance,
    bold: true,
  });
  total.eachCell({ includeEmpty: true }, (cell, column) => {
    if (column <= lastColumn) cell.border = { top: { style: "thin" } };
  });

  sheet.addRow([]);
  for (const note of info.notes) {
    sheet.addRow([note]).font = { italic: true, size: 9, color: { argb: "FF69766F" } };
  }

  sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];
  sheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: lastColumn },
  };

  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

// Standard PDF fonts only cover WinAnsi; swap the Unicode minus for a hyphen.
function pdfRupiah(amount: number) {
  return formatRupiah(amount).replace("−", "-");
}

async function renderPdf(report: CashReport, options: ExportOptions) {
  const { default: pdfmake } = (await import("pdfmake")) as unknown as {
    default: typeof import("pdfmake");
  };
  pdfmake.setFonts({
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  });
  // Never fetch remote resources or read local files while rendering.
  pdfmake.setUrlAccessPolicy(() => false);

  const info = describe(report, options);
  const muted = "#69766F";
  const amountCell = (text: string, color?: string, bold?: boolean): TableCell => ({
    text,
    alignment: "right",
    color,
    bold,
    noWrap: true,
  });
  const empty = { text: "—", color: "#9AA49F", alignment: "right" as const };

  const header: TableCell[] = [
    "TANGGAL",
    "NO. REF",
    "KETERANGAN",
    "KATEGORI",
    { text: "PEMASUKAN", alignment: "right" },
    { text: "PENGELUARAN", alignment: "right" },
    ...(options.running ? [{ text: "SALDO", alignment: "right" as const }] : []),
  ].map((cell) =>
    typeof cell === "string" ? { text: cell, style: "th" } : { ...(cell as object), style: "th" },
  ) as TableCell[];

  const body: TableCell[][] = [header];
  if (options.running) {
    body.push([
      formatTableDate(report.query.from),
      "",
      { text: "Saldo awal periode", bold: true },
      "—",
      empty,
      empty,
      amountCell(pdfRupiah(report.openingBalance), undefined, true),
    ]);
  }
  for (const row of report.rows) {
    body.push([
      { text: formatTableDate(row.effectiveDate), noWrap: true },
      { text: row.ref, color: muted, noWrap: true },
      row.label,
      row.categoryName,
      row.kind === "income" ? amountCell(`+ ${pdfRupiah(row.amount)}`, "#16704F") : empty,
      row.kind === "expense" ? amountCell(`- ${pdfRupiah(row.amount)}`, "#B44D48") : empty,
      ...(options.running ? [amountCell(pdfRupiah(row.balance), undefined, true)] : []),
    ]);
  }
  if (report.rows.length === 0) {
    body.push([
      {
        text: "Tidak ada transaksi yang cocok pada periode ini.",
        colSpan: options.running ? 7 : 6,
        italics: true,
        color: muted,
        alignment: "center",
      },
      ...Array.from({ length: options.running ? 6 : 5 }, () => ""),
    ]);
  }
  body.push([
    { text: formatTableDate(report.query.to), bold: true, noWrap: true },
    "",
    { text: info.totalLabel, bold: true },
    "",
    info.showIncome ? amountCell(`+ ${pdfRupiah(report.shownIncome)}`, "#16704F", true) : empty,
    info.showExpense ? amountCell(`- ${pdfRupiah(report.shownExpense)}`, "#B44D48", true) : empty,
    ...(options.running ? [amountCell(pdfRupiah(report.closingBalance), undefined, true)] : []),
  ]);
  const lastBodyRow = body.length - 1;

  const content: Content[] = [
    { text: info.title.toUpperCase(), style: "eyebrow" },
    { text: report.mosqueName, style: "title" },
    { text: `Periode: ${info.period}`, margin: [0, 6, 0, 0] },
    { text: `Cakupan data: ${info.scope}`, margin: [0, 2, 0, 0] },
    { text: `Diekspor: ${info.exported}`, color: muted, fontSize: 8, margin: [0, 2, 0, 14] },
    {
      table: {
        widths: info.summary.map(() => "*"),
        body: [
          info.summary.map((item) => ({ text: item.label.toUpperCase(), style: "th" })),
          info.summary.map((item) => ({
            stack: [
              { text: pdfRupiah(item.value), bold: true, fontSize: 11 },
              {
                text: item.caption.replace("−", "-"),
                fontSize: 7.5,
                color: muted,
                margin: [0, 2, 0, 0],
              },
            ],
          })),
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 16],
    },
    {
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: options.running ? [52, 68, "*", 66, 64, 64, 68] : [56, 70, "*", 80, 74, 74],
        body,
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex === 0 ? "#F4F7F8" : null),
        hLineWidth: (index, node) =>
          index === 0 || index === 1 || index === node.table.body.length
            ? 0
            : index === lastBodyRow
              ? 1
              : 0.5,
        hLineColor: (index) => (index === lastBodyRow ? "#17241D" : "#E6EBE8"),
        vLineWidth: () => 0,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
    },
    ...info.notes.map((note): Content => ({
      text: note,
      fontSize: 8,
      color: muted,
      margin: [0, 10, 0, 0],
    })),
  ];

  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [36, 40, 36, 48],
    info: { title: `${info.title} ${report.mosqueName} ${formatRange(report.query)}` },
    defaultStyle: { font: "Helvetica", fontSize: 8.5, color: "#17241D" },
    styles: {
      eyebrow: { fontSize: 8, bold: true, color: muted, characterSpacing: 0.5 },
      title: { fontSize: 16, bold: true, margin: [0, 2, 0, 0] },
      th: { fontSize: 7, bold: true, color: "#63736D" },
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `${report.mosqueName} · ${formatRange(report.query)}`, color: muted },
        { text: `Halaman ${currentPage} dari ${pageCount}`, alignment: "right", color: muted },
      ],
      fontSize: 7.5,
      margin: [36, 16, 36, 0],
    }),
    content,
  };

  const buffer = await pdfmake.createPdf(definition).getBuffer();
  return new Uint8Array(buffer);
}

export const reportMimeTypes: Record<ReportFormat, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

/** Renders the cash report file; rows and totals come straight from `buildCashReport`. */
export function renderCashReport(report: CashReport, format: ReportFormat, options: ExportOptions) {
  return format === "xlsx" ? renderXlsx(report, options) : renderPdf(report, options);
}
