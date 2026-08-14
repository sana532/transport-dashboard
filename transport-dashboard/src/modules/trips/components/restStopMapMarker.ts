import L from 'leaflet'

export const REST_STOP_MARKER_SIZE = 32
export const REST_STOP_MARKER_COLOR = '#B45309'

function restStopBadgeHtml(label: string): string {
  const safe = label
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

  return `<div class="trip-rest-stop-marker" title="${safe}">
    <span class="trip-rest-stop-marker__pin" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
    </span>
  </div>`
}

export function createRestStopLeafletIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: 'trip-rest-stop-leaflet-icon',
    html: restStopBadgeHtml(name),
    iconSize: [REST_STOP_MARKER_SIZE, REST_STOP_MARKER_SIZE],
    iconAnchor: [REST_STOP_MARKER_SIZE / 2, REST_STOP_MARKER_SIZE / 2],
  })
}
