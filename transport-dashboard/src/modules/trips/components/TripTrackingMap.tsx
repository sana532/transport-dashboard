import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { TripLocationUpdate } from '@/modules/trips/types/tripTracking'
import {
  BUS_BRAND_GREEN,
  BusMapGlyph,
  createBusLeafletIcon,
} from '@/modules/trips/components/busMapMarker'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { cn } from '@/shared/utils/cn'
import 'leaflet/dist/leaflet.css'

const DAMASCUS_CENTER: L.LatLngExpression = [33.5138, 36.2765]
const TRAIL_MAX_POINTS = 500
const TRAIL_MIN_DISTANCE_METERS = 8

const busIcon = createBusLeafletIcon()

type TripTrackingMapProps = {
  location: TripLocationUpdate | null
  /** Soften marker/trail when showing estimated or frozen stale position. */
  isEstimated?: boolean
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

function BusMarker({ lat, lng }: { lat: number; lng: number }) {
  const markerRef = useRef<L.Marker>(null)
  const position = useMemo<L.LatLngExpression>(() => [lat, lng], [lat, lng])

  useEffect(() => {
    markerRef.current?.setLatLng(position)
  }, [position])

  return <Marker ref={markerRef} position={position} icon={busIcon} />
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
  fallbackCenter,
  className,
}: TripTrackingMapProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [trail, setTrail] = useState<L.LatLngExpression[]>([])
  const [recenterToken, setRecenterToken] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const trackedTripIdRef = useRef<number | null>(null)

  const initialCenter = fallbackCenter ?? DAMASCUS_CENTER
  const hasLocation = location != null

  useEffect(() => {
    if (!location) return

    if (trackedTripIdRef.current !== location.trip_id) {
      trackedTripIdRef.current = location.trip_id
      setTrail([[location.lat, location.lng]])
      return
    }

    const point: L.LatLngExpression = [location.lat, location.lng]
    setTrail((current) => appendTrailPoint(current, point))
  }, [location])

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

        {trailPositions.length >= 2 ? (
          <Polyline
            positions={trailPositions}
            pathOptions={{
              color: BUS_BRAND_GREEN,
              weight: 4,
              opacity: isEstimated ? 0.45 : 0.85,
              dashArray: isEstimated ? '4 10' : '10 14',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ) : null}

        {hasLocation ? (
          <>
            <BusMarker lat={location.lat} lng={location.lng} />
            <InitialMapCenter lat={location.lat} lng={location.lng} enabled />
            <RecenterBus lat={location.lat} lng={location.lng} token={recenterToken} />
          </>
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
