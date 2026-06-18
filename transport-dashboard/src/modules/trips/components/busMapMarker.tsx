import L from 'leaflet'
import { cn } from '@/shared/utils/cn'

export const BUS_BRAND_GREEN = '#2F3E1F'
export const BUS_MARKER_BADGE_SIZE = 44

/** Side-view minibus outline — matches the mobile app control icon. */
const BUS_BODY_PATH =
  'M4 10v4.2c0 .7.6 1.3 1.3 1.3h1.2M19 15.5h.7c.7 0 1.3-.6 1.3-1.3V11l-2.8-3.5A1.5 1.5 0 0 0 16.8 7H5.3A1.3 1.3 0 0 0 4 8.3V10'
const BUS_FLOOR_PATH = 'M5.5 15.5h13'

const BUS_WINDOWS = [
  { x: 6.5, y: 10.2, width: 2.2, height: 2.6 },
  { x: 9.8, y: 10.2, width: 2.2, height: 2.6 },
  { x: 13.1, y: 10.2, width: 2, height: 2.6 },
] as const

const BUS_WHEELS = [
  { cx: 7.8, cy: 16.8, r: 1.2 },
  { cx: 15.2, cy: 16.8, r: 1.2 },
] as const

const BUS_STROKE = 1.5

function busGlyphSvgMarkup(strokeColor: string): string {
  const windows = BUS_WINDOWS.map(
    (window) =>
      `<rect x="${window.x}" y="${window.y}" width="${window.width}" height="${window.height}" rx="0.4" fill="none" stroke="${strokeColor}" stroke-width="${BUS_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`,
  ).join('')
  const wheels = BUS_WHEELS.map(
    (wheel) =>
      `<circle cx="${wheel.cx}" cy="${wheel.cy}" r="${wheel.r}" fill="none" stroke="${strokeColor}" stroke-width="${BUS_STROKE}"/>`,
  ).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="${BUS_STROKE}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${BUS_BODY_PATH}"/><path d="${BUS_FLOOR_PATH}"/>${windows}${wheels}</svg>`
}

const busMarkerBadgeHtml = `<div class="trip-bus-marker-badge">${busGlyphSvgMarkup('#ffffff')}</div>`

export function BusMapGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={BUS_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={BUS_BODY_PATH} />
      <path d={BUS_FLOOR_PATH} />
      {BUS_WINDOWS.map((window) => (
        <rect
          key={`${window.x}-${window.y}`}
          x={window.x}
          y={window.y}
          width={window.width}
          height={window.height}
          rx={0.4}
        />
      ))}
      {BUS_WHEELS.map((wheel) => (
        <circle key={`${wheel.cx}-${wheel.cy}`} cx={wheel.cx} cy={wheel.cy} r={wheel.r} />
      ))}
    </svg>
  )
}

export function BusMapBadge({ className }: { className?: string }) {
  return (
    <div className={cn('trip-bus-marker-badge shadow-lg', className)}>
      <BusMapGlyph className="h-[22px] w-[22px] text-white" />
    </div>
  )
}

export function createBusLeafletIcon(): L.DivIcon {
  return L.divIcon({
    className: 'trip-bus-leaflet-icon',
    html: busMarkerBadgeHtml,
    iconSize: [BUS_MARKER_BADGE_SIZE, BUS_MARKER_BADGE_SIZE],
    iconAnchor: [BUS_MARKER_BADGE_SIZE / 2, BUS_MARKER_BADGE_SIZE / 2],
  })
}
