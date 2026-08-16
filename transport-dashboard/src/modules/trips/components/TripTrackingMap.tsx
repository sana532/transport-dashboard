import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { TripLocationUpdate } from '@/modules/trips/types/tripTracking'
import {
  BUS_BRAND_GREEN,
  BUS_BRAND_GREY,
  BusMapGlyph,
  createBusLeafletIcon,
} from '@/modules/trips/components/busMapMarker'
import { createRestStopLeafletIcon } from '@/modules/trips/components/restStopMapMarker'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'
import 'leaflet/dist/leaflet.css'

const DAMASCUS_CENTER: L.LatLngExpression = [33.5138, 36.2765]
const TRAIL_MAX_POINTS = 500
const TRAIL_MIN_DISTANCE_METERS = 8
const CATCHUP_DURATION_MS = 900

const liveBusIcon = createBusLeafletIcon()
const mutedBusIcon = createBusLeafletIcon({ muted: true })

export type TripMapRestStop = {
  id: number
  name: string
  lat: number
  lng: number
  durationMinutes?: number
}

type TripTrackingMapProps = {
  location: TripLocationUpdate | null
  /** Soften marker/trail when showing estimated or frozen stale position. */
  isEstimated?: boolean
  /** Planned route as Leaflet [lat, lng] pairs (decoded polyline). */
  routePositions?: Array<[number, number]> | null
  /** Rest stops along the route (with coordinates). */
  restStops?: TripMapRestStop[] | null
  fallbackCenter?: L.LatLngExpression | null
  className?: string
}

function distanceMeters(a: L.LatLngExpression, b: L.LatLngExpression): number {
  return L.latLng(a).distanceTo(L.latLng(b))
}

function appendTrailPoint(
  trail: L.LatLngExpression[],
  point: L.LatLngExpression,
): L.LatLngExpression[] {
  if (trail.length === 0) return [point]

  const last = trail[trail.length - 1]
  if (distanceMeters(last, point) < TRAIL_MIN_DISTANCE_METERS) return trail

  const next = [...trail, point]
  if (next.length <= TRAIL_MAX_POINTS) return next
  return next.slice(next.length - TRAIL_MAX_POINTS)
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function BusMarker({
  lat,
  lng,
  muted,
  animateFrom,
}: {
  lat: number
  lng: number
  muted: boolean
  /** When set, smoothly animate from this position to lat/lng. */
  animateFrom?: { lat: number; lng: number } | null
}) {
  const markerRef = useRef<L.Marker>(null)
  const [display, setDisplay] = useState({ lat, lng })
  const animFrameRef = useRef<number | null>(null)
  const prevTargetRef = useRef({ lat, lng })

  useEffect(() => {
    const target = { lat, lng }
    const from =
      animateFrom ??
      (prevTargetRef.current.lat !== lat || prevTargetRef.current.lng !== lng
        ? display
        : null)

    prevTargetRef.current = target

    if (!from || (from.lat === lat && from.lng === lng)) {
      setDisplay(target)
      markerRef.current?.setLatLng([lat, lng])
      return
    }

    const jumpMeters = distanceMeters([from.lat, from.lng], [lat, lng])
    if (jumpMeters < 2) {
      setDisplay(target)
      markerRef.current?.setLatLng([lat, lng])
      return
    }

    if (animFrameRef.current != null) {
      window.cancelAnimationFrame(animFrameRef.current)
    }

    const startedAt = performance.now()

    const step = (now: number) => {
      const raw = Math.min(1, (now - startedAt) / CATCHUP_DURATION_MS)
      const t = easeOutCubic(raw)
      const next = {
        lat: lerp(from.lat, lat, t),
        lng: lerp(from.lng, lng, t),
      }
      setDisplay(next)
      markerRef.current?.setLatLng([next.lat, next.lng])
      if (raw < 1) {
        animFrameRef.current = window.requestAnimationFrame(step)
      } else {
        animFrameRef.current = null
      }
    }

    animFrameRef.current = window.requestAnimationFrame(step)
    return () => {
      if (animFrameRef.current != null) {
        window.cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
    // Only re-run when the target GPS point changes (or explicit animateFrom).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- display is the animation source, not a trigger
  }, [lat, lng, animateFrom?.lat, animateFrom?.lng])

  const position = useMemo<L.LatLngExpression>(
    () => [display.lat, display.lng],
    [display.lat, display.lng],
  )

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={muted ? mutedBusIcon : liveBusIcon}
    />
  )
}

function FitRouteBounds({
  positions,
  enabled,
}: {
  positions: Array<[number, number]>
  enabled: boolean
}) {
  const map = useMap()
  const fittedRef = useRef(false)

  useEffect(() => {
    if (!enabled || fittedRef.current || positions.length < 2) return
    const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]))
    map.fitBounds(bounds, { padding: [36, 36], animate: false, maxZoom: 12 })
    fittedRef.current = true
  }, [enabled, positions, map])

  return null
}

function InitialMapCenter({
  lat,
  lng,
  enabled,
}: {
  lat: number
  lng: number
  enabled: boolean
}) {
  const map = useMap()
  const centeredRef = useRef(false)

  useEffect(() => {
    if (!enabled || centeredRef.current) return
    map.setView([lat, lng], 14, { animate: false })
    centeredRef.current = true
  }, [enabled, lat, lng, map])

  return null
}

function RecenterBus({
  lat,
  lng,
  token,
}: {
  lat: number
  lng: number
  token: number
}) {
  const map = useMap()

  useEffect(() => {
    if (token === 0) return
    map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true })
  }, [token, lat, lng, map])

  return null
}

function MapControlButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
        className,
      )}
      style={{ backgroundColor: BUS_BRAND_GREEN }}
    >
      {children}
    </button>
  )
}

export const TripTrackingMap = memo(function TripTrackingMap({
  location,
  isEstimated = false,
  routePositions = null,
  restStops = null,
  fallbackCenter,
  className,
}: TripTrackingMapProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [trail, setTrail] = useState<L.LatLngExpression[]>([])
  const [recenterToken, setRecenterToken] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const trackedTripIdRef = useRef<number | null>(null)
  const previousDisplayRef = useRef<{ lat: number; lng: number } | null>(null)
  const [catchUpFrom, setCatchUpFrom] = useState<{ lat: number; lng: number } | null>(null)
  const wasEstimatedRef = useRef(false)

  const initialCenter = fallbackCenter ?? DAMASCUS_CENTER
  const hasLocation = location != null
  const hasRoute = (routePositions?.length ?? 0) >= 2
  const mappedRestStops = restStops?.filter(
    (stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng),
  ) ?? []

  const restStopIcons = useMemo(() => {
    const map = new Map<number, L.DivIcon>()
    for (const stop of mappedRestStops) {
      map.set(stop.id, createRestStopLeafletIcon(stop.name))
    }
    return map
  }, [mappedRestStops])

  useEffect(() => {
    if (!location) return

    let catchUpClearId: number | undefined

    if (trackedTripIdRef.current !== location.trip_id) {
      trackedTripIdRef.current = location.trip_id
      setTrail([[location.lat, location.lng]])
      previousDisplayRef.current = { lat: location.lat, lng: location.lng }
      wasEstimatedRef.current = isEstimated
      setCatchUpFrom(null)
      return
    }

    // Returning from estimated → live: animate from last predicted spot.
    if (wasEstimatedRef.current && !isEstimated && previousDisplayRef.current) {
      const from = previousDisplayRef.current
      setCatchUpFrom(from)
      catchUpClearId = window.setTimeout(() => {
        setCatchUpFrom((current) =>
          current && current.lat === from.lat && current.lng === from.lng ? null : current,
        )
      }, CATCHUP_DURATION_MS + 50)
    } else if (!isEstimated) {
      setCatchUpFrom(null)
    }

    wasEstimatedRef.current = isEstimated
    previousDisplayRef.current = { lat: location.lat, lng: location.lng }

    if (!isEstimated) {
      const point: L.LatLngExpression = [location.lat, location.lng]
      setTrail((current) => appendTrailPoint(current, point))
    }

    return () => {
      if (catchUpClearId != null) window.clearTimeout(catchUpClearId)
    }
  }, [location, isEstimated])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const node = containerRef.current
    if (!node) return

    try {
      if (document.fullscreenElement === node) {
        await document.exitFullscreen()
      } else {
        await node.requestFullscreen()
      }
    } catch {
      // Browser may block fullscreen without user gesture — button click satisfies this.
    }
  }, [])

  const centerOnBus = useCallback(() => {
    if (!hasLocation) return
    setRecenterToken((value) => value + 1)
  }, [hasLocation])

  const trailPositions = trail.length >= 2 ? trail : []

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-surface-muted bg-surface',
        isFullscreen ? 'h-screen rounded-none border-0' : 'h-[min(70vh,520px)]',
        className,
      )}
    >
      <MapContainer
        center={initialCenter}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hasRoute && routePositions ? (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: BUS_BRAND_GREEN,
              weight: 5,
              opacity: 0.75,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ) : null}

        {trailPositions.length >= 2 ? (
          <Polyline
            positions={trailPositions}
            pathOptions={{
              color: isEstimated ? BUS_BRAND_GREY : '#94A3B8',
              weight: 3,
              opacity: isEstimated ? 0.45 : 0.7,
              dashArray: '6 10',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ) : null}

        {mappedRestStops.map((stop) => (
          <Marker
            key={`rest-${stop.id}`}
            position={[stop.lat, stop.lng]}
            icon={restStopIcons.get(stop.id) ?? createRestStopLeafletIcon(stop.name)}
          >
            <Popup>
              <div className="min-w-[10rem] space-y-1 text-start" dir="auto">
                <p className="text-sm font-semibold text-text-primary">{stop.name}</p>
                {stop.durationMinutes != null ? (
                  <p className="text-xs text-text-muted">
                    {t('tripTracking.restStopDuration', { minutes: stop.durationMinutes })}
                  </p>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}

        {hasLocation ? (
          <>
            <BusMarker
              lat={location.lat}
              lng={location.lng}
              muted={isEstimated}
              animateFrom={!isEstimated ? catchUpFrom : null}
            />
            <InitialMapCenter lat={location.lat} lng={location.lng} enabled />
            <RecenterBus lat={location.lat} lng={location.lng} token={recenterToken} />
          </>
        ) : hasRoute && routePositions ? (
          <FitRouteBounds positions={routePositions} enabled />
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <div className="pointer-events-auto absolute end-3 top-3">
          <MapControlButton
            label={
              isFullscreen ? t('tripTracking.exitFullscreen') : t('tripTracking.fullscreen')
            }
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" aria-hidden />
            ) : (
              <Maximize2 className="h-5 w-5" aria-hidden />
            )}
          </MapControlButton>
        </div>

        <div className="pointer-events-auto absolute bottom-3 start-3">
          <MapControlButton
            label={t('tripTracking.centerOnBus')}
            onClick={centerOnBus}
            className={cn(!hasLocation && 'pointer-events-none opacity-50')}
          >
            <BusMapGlyph className="h-[22px] w-[22px] text-white" />
          </MapControlButton>
        </div>
      </div>
    </div>
  )
})
