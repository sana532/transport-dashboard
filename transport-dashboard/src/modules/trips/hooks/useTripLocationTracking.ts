import { useEffect, useState } from 'react'
import { getEcho, getPusherConnection } from '@/shared/realtime/echo'
import {
  TRIP_LOCATION_UPDATED_EVENT,
  TRIP_LOCATION_UPDATED_EVENT_DOTS,
  TRIP_LOCATION_UPDATED_EVENT_SHORT,
  tripPrivateChannelName,
  tripTrackingChannel,
  parseTripLocationPayload,
  type TripLocationUpdate,
  type TripTrackingConnectionStatus,
} from '@/modules/trips/types/tripTracking'

const CONNECTION_TIMEOUT_MS = 20_000

type EchoPrivateChannel = {
  listen: (event: string, callback: (payload: unknown) => void) => EchoPrivateChannel
  listenToAll?: (callback: (event: string, payload: unknown) => void) => EchoPrivateChannel
  stopListening: (event: string, callback: (payload: unknown) => void) => void
  stopListeningToAll?: (callback?: (event: string, payload: unknown) => void) => void
  subscribed?: (callback: () => void) => EchoPrivateChannel
  error?: (callback: (error: unknown) => void) => EchoPrivateChannel
  subscription?: {
    bind: (event: string, callback: (...args: unknown[]) => void) => void
    unbind: (event: string, callback: (...args: unknown[]) => void) => void
  }
}

export function useTripLocationTracking(tripId: string | undefined) {
  const [location, setLocation] = useState<TripLocationUpdate | null>(null)
  const [connectionStatus, setConnectionStatus] =
    useState<TripTrackingConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = Number(tripId)
    if (!Number.isFinite(id)) {
      setConnectionStatus('idle')
      setError('Invalid trip id')
      return
    }

    if (!import.meta.env.VITE_REVERB_APP_KEY) {
      setConnectionStatus('unconfigured')
      setError('WebSocket is not configured (missing VITE_REVERB_APP_KEY)')
      return
    }

    const token = localStorage.getItem('token') ?? localStorage.getItem('auth_token')
    if (!token) {
      setConnectionStatus('error')
      setError('Not authenticated')
      return
    }

    const echo = getEcho()
    if (!echo) {
      setConnectionStatus('error')
      setError('Failed to initialize realtime connection')
      return
    }

    setConnectionStatus('connecting')
    setError(null)

    const channelName = tripTrackingChannel(id)
    const privateChannelName = tripPrivateChannelName(id)
    let channel: EchoPrivateChannel | null = null
    let subscribed = false

    const onLocation = (raw: unknown) => {
      if (import.meta.env.DEV) {
        console.info('[Echo] TripLocationUpdated raw payload:', raw)
      }

      const payload = parseTripLocationPayload(raw, id)
      if (!payload) {
        if (import.meta.env.DEV) {
          console.warn('[Echo] TripLocationUpdated ignored — could not parse payload')
        }
        return
      }
      if (payload.trip_id !== id) {
        if (import.meta.env.DEV) {
          console.warn('[Echo] TripLocationUpdated ignored — trip_id mismatch', {
            expected: id,
            received: payload.trip_id,
          })
        }
        return
      }

      if (import.meta.env.DEV) {
        console.info('[Echo] TripLocationUpdated applied:', payload)
      }
      setLocation(payload)
      setConnectionStatus('connected')
      setError(null)
    }

    const onSubscribed = () => {
      console.info('[Echo] Subscription succeeded:', privateChannelName)
      setConnectionStatus('connected')
      setError(null)
    }

    const onSubscriptionError = (status: unknown) => {
      console.error('[Echo] Subscription error:', status)
      const message =
        status && typeof status === 'object' && 'error' in status
          ? String((status as { error?: string }).error)
          : 'Failed to subscribe to trip tracking channel'
      setConnectionStatus('error')
      setError(message)
    }

    const onAnyChannelEvent = (eventName: string, raw: unknown) => {
      if (import.meta.env.DEV) {
        console.info('[Echo] Channel event received:', eventName, raw)
      }
      onLocation(raw)
    }

    function subscribeToChannel() {
      if (subscribed) return
      subscribed = true

      console.log('[Echo] WS connected — subscribing:', privateChannelName)
      console.log('[Echo] Listening for:', TRIP_LOCATION_UPDATED_EVENT)

      channel = echo.private(channelName) as EchoPrivateChannel
      channel.listen(TRIP_LOCATION_UPDATED_EVENT, onLocation)
      channel.listen(TRIP_LOCATION_UPDATED_EVENT_DOTS, onLocation)
      channel.listen(TRIP_LOCATION_UPDATED_EVENT_SHORT, onLocation)
      channel.listenToAll?.(onAnyChannelEvent)

      channel.subscribed?.(onSubscribed)
      channel.error?.(onSubscriptionError)
      channel.subscription?.bind('pusher:subscription_succeeded', onSubscribed)
      channel.subscription?.bind('pusher:subscription_error', onSubscriptionError)
    }

    const connection = getPusherConnection()
    const onDisconnected = () => setConnectionStatus('disconnected')
    const onConnected = () => {
      setConnectionStatus('connected')
      setError(null)
      subscribeToChannel()
    }
    const onConnectionError = (raw: unknown) => {
      const message =
        raw && typeof raw === 'object' && 'error' in raw
          ? String((raw as { error?: unknown }).error)
          : 'WebSocket connection failed'
      setConnectionStatus('error')
      setError(message)
    }

    const onStateChange = (states: unknown) => {
      const current =
        states && typeof states === 'object' && 'current' in states
          ? String((states as { current?: string }).current)
          : null
      if (import.meta.env.DEV && current) {
        console.info('[Echo] Connector state:', current)
      }
      if (current === 'connected') {
        onConnected()
      }
    }

    connection?.bind('disconnected', onDisconnected)
    connection?.bind('connected', onConnected)
    connection?.bind('state_change', onStateChange)
    connection?.bind('error', onConnectionError)
    connection?.bind('failed', onConnectionError)

    if (connection?.state === 'connected') {
      subscribeToChannel()
    }

    const timeoutId = window.setTimeout(() => {
      setConnectionStatus((current) => {
        if (current !== 'connecting') return current
        setError(
          'Realtime connection timed out. Verify Reverb WSS and /api/broadcasting/auth access.',
        )
        return 'error'
      })
    }, CONNECTION_TIMEOUT_MS)

    return () => {
      window.clearTimeout(timeoutId)
      if (channel) {
        channel.stopListening(TRIP_LOCATION_UPDATED_EVENT, onLocation)
        channel.stopListening(TRIP_LOCATION_UPDATED_EVENT_DOTS, onLocation)
        channel.stopListening(TRIP_LOCATION_UPDATED_EVENT_SHORT, onLocation)
        channel.stopListeningToAll?.(onAnyChannelEvent)
        channel.subscription?.unbind('pusher:subscription_succeeded', onSubscribed)
        channel.subscription?.unbind('pusher:subscription_error', onSubscriptionError)
      }
      echo.leave(channelName)
      connection?.unbind('disconnected', onDisconnected)
      connection?.unbind('connected', onConnected)
      connection?.unbind('state_change', onStateChange)
      connection?.unbind('error', onConnectionError)
      connection?.unbind('failed', onConnectionError)
      setConnectionStatus('idle')
    }
  }, [tripId])

  return { location, connectionStatus, error }
}

export { parseTripLocationPayload } from '@/modules/trips/types/tripTracking'
