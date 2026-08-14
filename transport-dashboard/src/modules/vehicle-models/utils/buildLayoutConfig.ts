import { DEFAULT_LAYOUT_CONFIG_JSON } from '@/modules/vehicle-models/types'
import { parseLayoutConfig } from '@/modules/vehicle-models/utils/parseLayoutConfig'

export type LayoutFormOptions = {
  seatCount: number
  rows: number
  hasAisle: boolean
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** Builds a uniform grid: total seats = rows × seats-per-row. */
export function normalizeLayoutFormOptions(
  options: LayoutFormOptions,
): LayoutFormOptions {
  const rows = clampInt(options.rows, 1, 30)
  const maxSeatsPerRow = options.hasAisle ? 19 : 20
  const rawSeatsPerRow =
    rows > 0 && Number.isFinite(options.seatCount)
      ? Math.round(options.seatCount / rows)
      : 1
  const seatsPerRow = clampInt(rawSeatsPerRow, 1, maxSeatsPerRow)

  return {
    seatCount: seatsPerRow * rows,
    rows,
    hasAisle: options.hasAisle,
  }
}

export function buildLayoutConfigJson(options: LayoutFormOptions): string {
  const { seatCount, rows, hasAisle } = normalizeLayoutFormOptions(options)
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
