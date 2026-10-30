import { withConnectionGoneDetection } from '@universe/websocket/src/client/withConnectionGoneDetection'
import { SubscriptionManager } from '@universe/websocket/src/subscriptions/SubscriptionManager'
import type {
  ConnectionStatus,
  CreateWebSocketClientOptions,
  SocketFactoryOptions,
  SubscriptionOptions,
  WebSocketClient,
  WebSocketLike,
} from '@universe/websocket/src/types'
import { addJitter, getDefaultJitteredDelay } from '@universe/websocket/src/utils/backoff'
import { WebSocket as PartySocket } from 'partysocket'

/** Default socket factory using PartySocket */
function defaultSocketFactory(url: string, options: SocketFactoryOptions): WebSocketLike {
  return new PartySocket(url, [], options)
}

/** Default configuration for WebSocket connection behavior */
const DEFAULT_CONFIG = {
  // Maximum delay (ms) between reconnection attempts
  maxReconnectionDelay: 10000,
  // Minimum delay (ms) between reconnection attempts (before jitter is applied)
  minReconnectionDelay: 1000,
  // Time (ms) to wait for a connection to establish before timing out
  connectionTimeout: 4000,
  // Maximum number of reconnection attempts before giving up
  maxRetries: 5,
  // Enable debug logging for connection events
  debug: false,
  // Close codes meaning the server shed this connection on purpose (1013 = try again later)
  overloadCloseCodes: [1013],
  // Base hold-off before the single retry after an overload close (+50% jitter)
  overloadRetryDelayMs: 60_000,
}

/**
 * Creates a generic WebSocket client with subscription management.
 *
 * The client handles:
 * - Lazy connection lifecycle (connects on first subscribe, disconnects on last unsubscribe)
 * - Subscription management via SubscriptionManager (reference counting, microtask batching)
 * - Message parsing and routing to appropriate subscribers
 *
 * Consumers provide:
 * - connectionStore: Manages connection state (status, connectionId, errors)
 * - subscriptionHandler: REST API for subscribe/unsubscribe calls
 * - parseMessage: Convert raw WS messages to typed messages
 * - parseConnectionMessage: Extract connectionId from initial message
 * - createSubscriptionKey: Create unique keys for subscriptions
 */
export function createWebSocketClient<TParams, TMessage>(
  options: CreateWebSocketClientOptions<TParams, TMessage>,
): WebSocketClient<TParams, TMessage> {
  const {
    config,
    connectionStore,
    subscriptionHandler,
    parseMessage,
    parseConnectionMessage,
    createSubscriptionKey,
    onError,
    onRawMessage,
    sessionRefreshIntervalMs,
    socketFactory = defaultSocketFactory,
  } = options

  const {
    url,
    maxReconnectionDelay = DEFAULT_CONFIG.maxReconnectionDelay,
    connectionTimeout = DEFAULT_CONFIG.connectionTimeout,
    maxRetries = DEFAULT_CONFIG.maxRetries,
    debug = DEFAULT_CONFIG.debug,
    overloadCloseCodes = DEFAULT_CONFIG.overloadCloseCodes,
    overloadRetryDelayMs = DEFAULT_CONFIG.overloadRetryDelayMs,
  } = config

  // Internal state
  let socket: WebSocketLike | null = null
  const connectionCallbacks = new Set<(connectionId: string) => void>()
  let wasConnected = false
  let sessionRefreshTimer: ReturnType<typeof setInterval> | null = null
  let disconnectTimer: ReturnType<typeof setTimeout> | null = null
  let overloadRetryTimer: ReturnType<typeof setTimeout> | null = null

  // An overload close (1013) means the server shed us deliberately — the
  // seconds-scale retry loop would just re-trigger the shed. Park the socket
  // (close() cancels PartySocket's auto-retry) and re-arm once after a long
  // jittered hold; the REST poller covers price freshness in the meantime.
  function holdReconnectForOverload(closedSocket: WebSocketLike): void {
    if (typeof closedSocket.reconnect !== 'function' || overloadRetryTimer !== null) {
      return
    }
    closedSocket.close()
    overloadRetryTimer = setTimeout(
      () => {
        overloadRetryTimer = null
        if (socket === closedSocket) {
          closedSocket.reconnect?.()
        }
      },
      addJitter(overloadRetryDelayMs, overloadRetryDelayMs / 2),
    )
  }

  function stopOverloadRetryTimer(): void {
    if (overloadRetryTimer !== null) {
      clearTimeout(overloadRetryTimer)
      overloadRetryTimer = null
    }
  }

  /**
   * `maxRetries` is a budget against hammering an unreachable gateway, but it
   * is spent in well under a minute, and the events that spend it are exactly
   * the ones a backgrounded tab produces: the OS suspends the page, the socket
   * closes, the retries all fail offline. The tab comes back to a socket that
   * has permanently given up. A page becoming visible, or the browser
   * reporting `online`, is new information the budget was never meant to veto.
   *
   * A fresh socket rather than `socket.reconnect()`: partysocket (1.1.10)
   * leaves its `_connectLock` set when `_connect` bails on the exhausted
   * budget, so `reconnect()` there is silently a no-op — the one case this
   * exists for.
   *
   * REVIVE_COOLDOWN_MS is what keeps the budget a budget. A fresh socket
   * starts at `_retryCount` 0, and partysocket's first attempt at 0 is
   * IMMEDIATE (the jittered delay only seeds the gaps between retries) — so
   * without a floor, a flapping `online` or a user cycling tabs buys an
   * unbounded stream of immediate connects, and a hard outage (1006, refused
   * TCP, an LB 502) never arms the 1013 hold that would otherwise absorb it.
   * The floor is one ladder long, which also stops a revive from tearing down
   * a retry sequence still in progress: a socket waiting between retries reads
   * CLOSED, so `readyState` alone cannot tell "given up" from "backing off".
   *
   * The swap itself is jittered because the triggering events are shared — one
   * network coming back fires `online` in every tab at once.
   */
  const REVIVE_COOLDOWN_MS = 30_000
  const REVIVE_JITTER_MS = 2_000
  let lastReviveAt = 0
  let reviveTimer: ReturnType<typeof setTimeout> | null = null

  /** Connected, or still trying. A socket waiting between partysocket retries
   * reads CLOSED, so this is "do not touch it", not "it is healthy". */
  function isLive(candidate: WebSocketLike): boolean {
    return candidate.readyState === WebSocket.OPEN || candidate.readyState === WebSocket.CONNECTING
  }

  function swapInFreshSocket(): void {
    // Re-check, with the SAME liveness test reviveConnection used: the jitter
    // window is long enough for partysocket's own retry timer to move the
    // socket CLOSED -> CONNECTING, and tearing down a handshake in flight is
    // the "recovery inside the gap" this re-check exists to avoid.
    if (!socket || overloadRetryTimer !== null || isLive(socket)) {
      return
    }
    replaceSocket(socket)
  }

  function replaceSocket(dead: WebSocketLike): void {
    stopSessionRefreshTimer()
    // Null first: the handlers registered on `dead` gate on `socket ===
    // thisSocket`, so its close event lands after the swap and is ignored.
    socket = null
    wasConnected = false
    dead.close()
    // The subscription REGISTRY has to survive — the React effects that own
    // these subscriptions won't re-run, so `resubscribeAll` on the new
    // connection message is the only thing that restores them. Just retire the
    // dead connection id, so a batch flush in the gap can't address it.
    subscriptionManager.setConnectionId(null)
    connectionStore.reset()
    connect()
  }

  function reviveConnection(): void {
    // No socket = no subscribers (or a deliberate disconnect): nothing to hold
    // open. An overload hold is the server's own instruction to stay away.
    if (!socket || overloadRetryTimer !== null || reviveTimer !== null) {
      return
    }
    if (isLive(socket)) {
      return
    }
    const now = Date.now()
    if (now - lastReviveAt < REVIVE_COOLDOWN_MS) {
      return
    }
    lastReviveAt = now
    reviveTimer = setTimeout(
      () => {
        reviveTimer = null
        swapInFreshSocket()
      },
      addJitter(0, REVIVE_JITTER_MS),
    )
  }

  /** Replaces a socket the server no longer knows, even if it still reads OPEN.
   * Shares the revive cooldown and jitter: a server-side lapse reaches every tab at once. */
  function retireGoneConnection(connectionId: string): void {
    if (!socket || connectionId !== subscriptionManager.getConnectionId()) {
      return
    }
    if (overloadRetryTimer !== null || reviveTimer !== null) {
      return
    }
    const now = Date.now()
    if (now - lastReviveAt < REVIVE_COOLDOWN_MS) {
      return
    }
    lastReviveAt = now
    const gone = socket
    reviveTimer = setTimeout(
      () => {
        reviveTimer = null
        if (socket === gone) {
          replaceSocket(gone)
        }
      },
      addJitter(0, REVIVE_JITTER_MS),
    )
  }

  function stopReviveTimer(): void {
    if (reviveTimer !== null) {
      clearTimeout(reviveTimer)
      reviveTimer = null
    }
  }

  /** `pageshow` as well as `visibilitychange`, for the reason lib/pulse.ts
   * binds both: Safari misses `visibilitychange` across a bfcache round trip,
   * which is every app switch on mobile web — and a bfcache restore always
   * hands back a closed socket. `pageshow` also fires for a tab opened in the
   * background, so this re-checks visibility rather than trusting the event. */
  function handleVisibilityChange(): void {
    if (document.visibilityState !== 'hidden') {
      reviveConnection()
    }
  }

  let lifecycleBound = false

  function bindLifecycle(): void {
    if (lifecycleBound || typeof document === 'undefined' || typeof window === 'undefined') {
      return
    }
    lifecycleBound = true
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handleVisibilityChange)
    window.addEventListener('online', reviveConnection)
  }

  function unbindLifecycle(): void {
    if (!lifecycleBound) {
      return
    }
    lifecycleBound = false
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pageshow', handleVisibilityChange)
    window.removeEventListener('online', reviveConnection)
  }

  function startSessionRefreshTimer(): void {
    stopSessionRefreshTimer()
    if (sessionRefreshIntervalMs && subscriptionHandler.refreshSession) {
      sessionRefreshTimer = setInterval(() => {
        subscriptionManager.refreshSession().catch((error) => onError?.(error))
      }, sessionRefreshIntervalMs)
    }
  }

  function stopSessionRefreshTimer(): void {
    if (sessionRefreshTimer !== null) {
      clearInterval(sessionRefreshTimer)
      sessionRefreshTimer = null
    }
  }

  // Subscription manager handles all subscription logic
  const subscriptionManager = new SubscriptionManager<TParams, TMessage>({
    handler: withConnectionGoneDetection(subscriptionHandler, retireGoneConnection),
    createKey: createSubscriptionKey,
    onError: (error, operation) => onError?.(error, operation),
    onSubscriptionCountChange: (count): void => {
      if (count > 0) {
        // Cancel any pending disconnect — new subscriptions arrived
        if (disconnectTimer !== null) {
          clearTimeout(disconnectTimer)
          disconnectTimer = null
        }
        if (!socket) {
          connect()
        }
      } else if (count === 0 && socket) {
        // Debounce disconnect to bridge React cleanup→setup gaps during navigation
        disconnectTimer = setTimeout(() => {
          disconnectTimer = null
          disconnect()
        }, 2000)
      }
    },
  })

  function notifyStatusChange(status: ConnectionStatus): void {
    connectionStore.setStatus(status)
  }

  function notifyConnectionEstablished(connectionId: string): void {
    connectionStore.setConnectionId(connectionId)
    for (const callback of connectionCallbacks) {
      callback(connectionId)
    }
  }

  function connect(): void {
    if (socket) {
      return
    }

    notifyStatusChange('connecting')

    // Bound to the socket's lifetime, not the client's: nothing to revive
    // before the first connect, and `disconnect` unbinds.
    bindLifecycle()

    // Add jitter to prevent thundering herd on reconnect
    const jitteredMinDelay = getDefaultJitteredDelay()

    socket = socketFactory(url, {
      maxReconnectionDelay,
      minReconnectionDelay: jitteredMinDelay,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout,
      maxRetries,
      debug,
    })

    // Capture a reference to this socket so event handlers can detect
    // stale events from a previous socket (e.g. during React Strict Mode
    // cleanup/remount cycles where disconnect + reconnect race).
    const thisSocket = socket

    socket.addEventListener('open', () => {
      if (socket !== thisSocket) {
        return
      }
      wasConnected = true
      startSessionRefreshTimer()
      notifyStatusChange('connected')
    })

    socket.addEventListener('close', (event) => {
      if (socket !== thisSocket) {
        return
      }
      stopSessionRefreshTimer()
      // Ignore close events after intentional disconnect (socket already nulled)
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      if (!socket) {
        return
      }
      const code = (event as { code?: number } | undefined)?.code
      if (code !== undefined && overloadCloseCodes.includes(code)) {
        holdReconnectForOverload(thisSocket)
      }
      if (wasConnected) {
        notifyStatusChange('reconnecting')
      } else {
        notifyStatusChange('disconnected')
      }
    })

    socket.addEventListener('error', () => {
      if (socket !== thisSocket) {
        return
      }
      onError?.(new Error('WebSocket error - check Network tab for details'))
      connectionStore.setError(new Error('WebSocket error'))
    })

    socket.addEventListener('message', (event) => {
      if (socket !== thisSocket) {
        return
      }
      try {
        const message: unknown = JSON.parse((event as { data: string }).data)
        onRawMessage?.(message)

        // Check for connection established message
        const connectionInfo = parseConnectionMessage(message)
        if (connectionInfo) {
          const { connectionId } = connectionInfo
          subscriptionManager.setConnectionId(connectionId)
          notifyConnectionEstablished(connectionId)

          // Always resubscribe if there are active subscriptions
          // Covers both reconnect and initial connect with queued subs
          if (subscriptionManager.hasActiveSubscriptions()) {
            subscriptionManager.resubscribeAll(connectionId).catch((error) => onError?.(error))
          }
          return
        }

        // Try to parse as a subscription message
        const parsed = parseMessage(message)
        if (parsed) {
          subscriptionManager.dispatch(parsed.key, parsed.data)
        }
      } catch (error) {
        onError?.(error)
      }
    })
  }

  function disconnect(): void {
    // Clear pending debounce timer first to prevent the timeout callback
    // from re-entering disconnect() after we've already torn down.
    const pendingTimer = disconnectTimer
    disconnectTimer = null
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer)
    }
    stopOverloadRetryTimer()
    stopReviveTimer()
    unbindLifecycle()
    if (socket) {
      stopSessionRefreshTimer()
      const s = socket
      wasConnected = false
      socket = null
      s.close()
      subscriptionManager.clear()
      connectionStore.reset()
      notifyStatusChange('disconnected')
    }
  }

  function isConnected(): boolean {
    return socket?.readyState === WebSocket.OPEN
  }

  function getConnectionStatus(): ConnectionStatus {
    return connectionStore.getStatus()
  }

  function getConnectionId(): string | null {
    return connectionStore.getConnectionId()
  }

  function subscribe(opts: SubscriptionOptions<TParams, TMessage>): () => void {
    return subscriptionManager.subscribe({
      channel: opts.channel,
      params: opts.params,
      callback: opts.onMessage,
    })
  }

  function onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    return connectionStore.onStatusChange(callback)
  }

  function onConnectionEstablished(callback: (connectionId: string) => void): () => void {
    connectionCallbacks.add(callback)
    return () => {
      connectionCallbacks.delete(callback)
    }
  }

  return {
    isConnected,
    getConnectionStatus,
    getConnectionId,
    subscribe,
    onStatusChange,
    onConnectionEstablished,
  }
}
