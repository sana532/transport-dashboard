export type LayoutCell =
  | { kind: 'seat'; seatNumber: number }
  | { kind: 'aisle' }

export type ParsedLayout = {
  columns: number
  rows: number
  cells: LayoutCell[][]
  seatCount: number
}

type StaticElement = {
  type?: string
  column?: number
  row_start?: number
  row_end?: number
}

function isAisleCell(
  rowIndex: number,
  colIndex: number,
  elements: StaticElement[],
): boolean {
  for (const element of elements) {
    if (element.type !== 'aisle') continue
    const column = Number(element.column)
    const rowStart = Number(element.row_start)
    const rowEnd = Number(element.row_end)
    if (!Number.isFinite(column) || !Number.isFinite(rowStart) || !Number.isFinite(rowEnd)) {
      continue
    }
    // API uses 1-based row/column indexes.
    if (colIndex + 1 === column && rowIndex + 1 >= rowStart && rowIndex + 1 <= rowEnd) {
      return true
    }
  }
  return false
}

export function parseLayoutConfig(
  json: string,
): { ok: true; layout: ParsedLayout } | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: 'Invalid JSON' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Layout must be a JSON object' }
  }

  const root = parsed as Record<string, unknown>
  const grid =
    root.grid && typeof root.grid === 'object'
      ? (root.grid as Record<string, unknown>)
      : null

  const columns = Number(grid?.columns ?? root.columns)
  const rows = Number(grid?.rows ?? root.rows)

  if (!Number.isFinite(columns) || columns < 1 || columns > 20) {
    return { ok: false, error: 'Missing or invalid grid.columns (1–20)' }
  }
  if (!Number.isFinite(rows) || rows < 1 || rows > 30) {
    return { ok: false, error: 'Missing or invalid grid.rows (1–30)' }
  }

  const staticElements = Array.isArray(root.static_elements)
    ? (root.static_elements as StaticElement[])
    : []

  const cells: LayoutCell[][] = []
  let seatNumber = 0

  for (let row = 0; row < rows; row += 1) {
    const rowCells: LayoutCell[] = []
    for (let col = 0; col < columns; col += 1) {
      if (isAisleCell(row, col, staticElements)) {
        rowCells.push({ kind: 'aisle' })
      } else {
        seatNumber += 1
        rowCells.push({ kind: 'seat', seatNumber })
      }
    }
    cells.push(rowCells)
  }

  return {
    ok: true,
    layout: {
      columns,
      rows,
      cells,
      seatCount: seatNumber,
    },
  }
}
