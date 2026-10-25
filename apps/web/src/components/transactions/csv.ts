/**
 * Minimal CSV reader/writer for transaction import and export. Exports use semicolons
 * (what Excel with Indonesian regional settings expects); imports accept `;` or `,`.
 */

export const CSV_DELIMITER = ";";

// Byte-order mark: tells Excel the file is UTF-8.
const BOM = String.fromCharCode(0xfeff);

function escapeCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[";\r\n,]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Builds a CSV document with a UTF-8 BOM so Excel shows Indonesian text correctly. */
export function toCsv(rows: readonly (readonly (string | number | null | undefined)[])[]) {
  return `${BOM}${rows.map((row) => row.map(escapeCell).join(CSV_DELIMITER)).join("\r\n")}\r\n`;
}

/** Parses CSV text into rows of cells. Handles quotes, escaped quotes and CRLF. */
export function parseCsv(text: string): string[][] {
  const source = text.startsWith(BOM) ? text.slice(1) : text;
  const firstLine = source.slice(0, source.search(/\r?\n|$/));
  const delimiter = firstLine.split(";").length >= firstLine.split(",").length ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
