import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo?: Echo<'reverb'>
    getEchoRuntimeDiagnostics?: () => ReturnType<typeof getEchoRuntimeDiagnostics>
  }
}

window.Pusher = Pusher

if (import.meta.env.DEV) {
  Pusher.logToConsole = true
}

/** Production Reverb — hardcoded. Never use window.location or localhost. */
const REVERB_WS_HOST = 'syria-travel.app' as const
const REVERB_WS_PORT = 443 as const
const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY
const REVERB_AUTH_ENDPOINT =
  import.meta.env.VITE_REVERB_AUTH_ENDPOINT ??
  'https://syria-travel.app/api/broadcasting/auth'

type PusherConnection = {
  bind: (event: string, cb: (...args: unknown[]) => void) => void
  unbind: (event: string, cb: (...args: unknown[]) => void) => void
  state: string
}

type PusherRuntime = {
  config?: {
    wsHost?: string
    wsPort?: number
    wssPort?: number
    wsPath?: string
    useTLS?: boolean
    enabledTransports?: string[]
    httpPath?: string
  }
  connection: PusherConnection
}

function readAuthToken(): string | null {
  return localStorage.getItem('token') ?? localStorage.getItem('auth_token')
}

function readPusher(instance: Echo<'reverb'> | null): PusherRuntime | null {
  if (!instance) return null

  const connector = instance.connector as { pusher?: PusherRuntime }
  return connector.pusher ?? null
}

function logPusherRuntimeConfig(pusher: PusherRuntime | null): void {
  if (!pusher?.config) {
    console.error('[Echo] Pusher config missing after initialization')
    return
  }

  const { wsHost, wsPort, wssPort, wsPath, useTLS, enabledTransports, httpPath } = pusher.config
  const resolvedWsUrl = `ws${useTLS ? 's' : ''}://${wsHost}:${useTLS ? wssPort : wsPort}${wsPath ?? ''}/app/${REVERB_KEY}`
  console.info('[Echo] Pusher runtime config:', {
    wsHost,
    wsPort,
    wssPort,
    wsPath,
    useTLS,
    enabledTransports,
    httpPath,
    resolvedWsUrl,
  })

  if (wsHost !== REVERB_WS_HOST) {
    console.error('[Echo] wsHost mismatch — expected', REVERB_WS_HOST, 'got', wsHost)
  }
}

let echoInstance: Echo<'reverb'> | null = null
let echoAuthToken: string | null = null

function isEchoConnectionReusable(instance: Echo<'reverb'>): boolean {
  const state = readPusher(instance)?.connection.state
  return state === 'connected' || state === 'connecting' || state === 'unavailable'
}

export function getEcho(): Echo<'reverb'> | null {
  console.info('[Echo] getEcho() called')

  if (!REVERB_KEY) {
    console.warn('[Echo] Skipped: missing VITE_REVERB_APP_KEY at build time')
    return null
  }

  const token = readAuthToken()
  if (!token) {
    console.warn('[Echo] Skipped: missing auth token (token/auth_token)')
    return null
  }

  if (echoInstance && echoAuthToken === token) {
    if (isEchoConnectionReusable(echoInstance)) {
      console.info('[Echo] Reusing existing Echo instance')
      logPusherRuntimeConfig(readPusher(echoInstance))
      return echoInstance
    }
    const staleState = readPusher(echoInstance)?.connection.state ?? 'unknown'
    console.warn('[Echo] Stale connection (%s) — reconnecting', staleState)
    disconnectEcho()
  }

  disconnectEcho()

  const wsUrl = `wss://${REVERB_WS_HOST}:${REVERB_WS_PORT}/app/${REVERB_KEY}`
  console.log('[Echo] Runtime env snapshot:', {
    keyDefined: Boolean(REVERB_KEY),
    wsHost: REVERB_WS_HOST,
    wsPort: REVERB_WS_PORT,
    authEndpoint: REVERB_AUTH_ENDPOINT,
    tokenDefined: Boolean(token),
    pageOrigin: window.location.origin,
  })
  console.log('[Echo] NOT localhost — WebSocket target:', wsUrl)
  console.log('[Echo] Auth endpoint:', REVERB_AUTH_ENDPOINT)

  echoAuthToken = token
  try {
    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: REVERB_KEY,
      wsHost: REVERB_WS_HOST,
      wsPort: REVERB_WS_PORT,
      wssPort: REVERB_WS_PORT,
      wsPath: '',
      forceTLS: true,
      // Both required: with forceTLS, pusher-js picks the "ws" strategy branch;
      // if only "wss" is listed, strategy.isSupported() is false → instant "failed".
      enabledTransports: ['ws', 'wss'],
      authEndpoint: REVERB_AUTH_ENDPOINT,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
      authorizer: (channel: { name: string }) => ({
        authorize: (socketId: string, callback: (error: Error | null, data: any) => void) => {
          console.info('[Echo] Auth request →', {
            endpoint: REVERB_AUTH_ENDPOINT,
            channel: channel.name,
            socketId,
          })
          fetch(REVERB_AUTH_ENDPOINT, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              socket_id: socketId,
              channel_name: channel.name,
            }).toString(),
          })
            .then(async (res) => {
              const text = await res.text()
              let data: unknown = {}
              try {
                data = text ? JSON.parse(text) : {}
              } catch {
                data = { raw: text }
              }
              console.info('[Echo] Auth response ←', {
                status: res.status,
                ok: res.ok,
                body: data,
              })
              if (!res.ok) {
                callback(new Error(`Auth failed with status ${res.status}`), data)
                return
              }
              callback(null, data)
            })
            .catch((error) => {
              console.error('[Echo] Auth request threw:', error)
              callback(error instanceof Error ? error : new Error(String(error)), {})
            })
        },
      }),
    })
  } catch (error) {
    console.error('[Echo] Failed to create Echo instance:', error)
    echoInstance = null
    echoAuthToken = null
    return null
  }

  window.Echo = echoInstance

  console.info(`[Reverb] Echo initialized → ${wsUrl}`)

  const pusher = readPusher(echoInstance)
  logPusherRuntimeConfig(pusher)

  const connection = pusher?.connection
  if (!connection) {
    console.error('[Echo] Pusher connection is missing after initialization')
  } else {
    console.info('[Echo] Initial connector state:', connection.state)
    connection.bind('state_change', (states: unknown) =>
      console.info('[Echo] Connector state_change:', states),
    )
    connection.bind('error', (error: unknown) => console.error('[Echo] Connector error:', error))
    connection.bind('failed', (error: unknown) =>
      console.error('[Echo] Connector failed:', error),
    )
    connection.bind('connected', () => console.info('[Echo] Connector connected'))
    connection.bind('disconnected', () => console.warn('[Echo] Connector disconnected'))
  }

  return echoInstance
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
  echoAuthToken = null
  delete window.Echo
}

export function getPusherConnection(): PusherConnection | null {
  return readPusher(echoInstance)?.connection ?? null
}

export function getEchoRuntimeDiagnostics() {
  const pusher = readPusher(echoInstance)
  const cfg = pusher?.config
  const resolvedWsUrl =
    cfg?.wsHost && REVERB_KEY
      ? `ws${cfg.useTLS ? 's' : ''}://${cfg.wsHost}:${cfg.useTLS ? cfg.wssPort : cfg.wsPort}${cfg.wsPath ?? ''}/app/${REVERB_KEY}`
      : null

  return {
    echoInitialized: Boolean(echoInstance),
    wsHost: cfg?.wsHost ?? null,
    wsPort: cfg?.wsPort ?? null,
    wssPort: cfg?.wssPort ?? null,
    wsPath: cfg?.wsPath ?? null,
    useTLS: cfg?.useTLS ?? null,
    enabledTransports: cfg?.enabledTransports ?? null,
    httpPath: cfg?.httpPath ?? null,
    resolvedWsUrl,
    connectionState: pusher?.connection.state ?? null,
    pageOrigin: window.location.origin,
    authEndpoint: REVERB_AUTH_ENDPOINT,
    note: 'pageOrigin is the React dev server. Echo WebSocket target is wsHost above, not pageOrigin.',
  }
}

if (import.meta.env.DEV) {
  window.getEchoRuntimeDiagnostics = getEchoRuntimeDiagnostics
}
