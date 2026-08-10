import { DEFAULT_LAYOUT_CONFIG_JSON } from '@/modules/vehicle-models/types'
import { parseLayoutConfig } from '@/modules/vehicle-models/utils/parseLayoutConfig'

export type LayoutFormOptions = {
  seatCount: number
  rows: number
  hasAisle: boolean
}

export type LayoutFormOptionsError =
  | 'rows'
  | 'seatCount'
  | 'notDivisible'
  | 'columns'

export function validateLayoutFormOptions(
  options: LayoutFormOptions,
): LayoutFormOptionsError | null {
  const { seatCount, rows, hasAisle } = options

  if (!Number.isInteger(rows) || rows < 1 || rows > 30) {
    return 'rows'
  }
  if (!Number.isInteger(seatCount) || seatCount < 1) {
    return 'seatCount'
  }
  if (seatCount % rows !== 0) {
    return 'notDivisible'
  }

  const seatsPerRow = seatCount / rows
  const columns = hasAisle ? seatsPerRow + 1 : seatsPerRow
  if (!Number.isInteger(columns) || columns < 1 || columns > 20) {
    return 'columns'
  }
  if (hasAisle && seatsPerRow < 1) {
    return 'seatCount'
  }

  return null
}

export function buildLayoutConfigJson(options: LayoutFormOptions): string {
  const error = validateLayoutFormOptions(options)
  if (error) {
    throw new Error(`Invalid layout options: ${error}`)
  }

  const { seatCount, rows, hasAisle } = options
  const seatsPerRow = seatCount / rows
  const columns = hasAisle ? seatsPerRow + 1 : seatsPerRow
  const left = Math.floor(seatsPerRow / 2)
  const right = seatsPerRow - left

  const config = {
    layout_type: hasAisle ? `${left}x${right}` : `${seatsPerRow}`,
    grid: {
      columns,
      rows,
    },
    static_elements: hasAisle
      ? [
          {
            type: 'aisle',
            column: left + 1,
            row_start: 1,
            row_end: rows,
            label: '',
          },
        ]
      : [],
  }

  return JSON.stringify(config, null, 2)
}

export function extractLayoutFormOptions(json: string): LayoutFormOptions | null {
  const parsed = parseLayoutConfig(json)
  if (!parsed.ok) return null

  const hasAisle = parsed.layout.cells.some((row) =>
    row.some((cell) => cell.kind === 'aisle'),
  )

  return {
    seatCount: parsed.layout.seatCount,
    rows: parsed.layout.rows,
    hasAisle,
  }
}

export function defaultLayoutFormOptions(): LayoutFormOptions {
  return (
    extractLayoutFormOptions(DEFAULT_LAYOUT_CONFIG_JSON) ?? {
      seatCount: 24,
      rows: 6,
      hasAisle: true,
    }
  )
}
