import type { ModelSeatInput, ModelSeatType } from '@/modules/vehicle-models/types'
import { parseLayoutConfig } from '@/modules/vehicle-models/utils/parseLayoutConfig'

function seatLetter(indexInRow: number): string {
  // A, B, … Z, then AA, AB… for unusually wide rows
  let n = indexInRow
  let label = ''
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

function resolveSeatType(
  columnIndex: number,
  columns: number,
  isAisleNeighbor: boolean,
): ModelSeatType {
  const isWindow = columnIndex === 1 || columnIndex === columns
  if (isWindow) return 'window'
  if (isAisleNeighbor) return 'aisle'
  return 'regular'
}

/**
 * Derives platform model-seat payloads from layout_config JSON
 * (same grid rules as SeatLayoutPreview / parseLayoutConfig).
 */
export function deriveModelSeatsFromLayout(layoutConfigJson: string): ModelSeatInput[] {
  const parsed = parseLayoutConfig(layoutConfigJson)
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }

  const { layout } = parsed
  const seats: ModelSeatInput[] = []

  for (let row = 0; row < layout.rows; row += 1) {
    const rowCells = layout.cells[row] ?? []
    let letterIndex = 0

    for (let col = 0; col < layout.columns; col += 1) {
      const cell = rowCells[col]
      if (!cell || cell.kind !== 'seat') continue

      const columnIndex = col + 1
      const rowIndex = row + 1
      const left = rowCells[col - 1]
      const right = rowCells[col + 1]
      const isAisleNeighbor =
        left?.kind === 'aisle' || right?.kind === 'aisle'

      seats.push({
        seat_number: cell.seatNumber,
        row_index: rowIndex,
        column_index: columnIndex,
        seat_type: resolveSeatType(columnIndex, layout.columns, isAisleNeighbor),
        label: `${rowIndex}${seatLetter(letterIndex)}`,
        sort_order: cell.seatNumber,
      })
      letterIndex += 1
    }
  }

  return seats
}
