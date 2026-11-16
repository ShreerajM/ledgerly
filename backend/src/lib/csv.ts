// Minimal CSV writer for the transaction report.
// Cells that start with = + - @ (or a tab/CR) are prefixed with a quote so spreadsheet apps
// show them as text instead of running them as formulas (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/

export function csvCell(value: unknown): string {
  let text = value instanceof Date ? value.toISOString() : String(value ?? '')
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','))
  // BOM so Excel opens the file as UTF-8; CRLF line endings per RFC 4180.
  return `\uFEFF${lines.join('\r\n')}\r\n`
}
