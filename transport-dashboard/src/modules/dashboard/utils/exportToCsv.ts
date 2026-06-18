type CsvScalar = string | number | boolean | null | undefined

function escapeCsv(value: CsvScalar): string {
  const text = value == null ? '' : String(value)
  const escaped = text.replace(/"/g, '""')
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
}

export function exportRowsToCsv(
  fileName: string,
  headers: string[],
  rows: CsvScalar[][],
): void {
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
