import { SubscriptionManager } from '@universe/websocket/src/subscriptions/SubscriptionManager'
import type {
  ConnectionStatus,
  CreateWebSocketClientOptions,
  SocketFactoryOptions,
  SubscriptionOptions,
  WebSocketClient,
  WebSocketLike,
} from '@universe/websocket/src/types'
import { getDefaultJitteredDelay } from '@universe/websocket/src/utils/backoff'
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
  } = config

  // Internal state
  let socket: WebSocketLike | null = null
  const connectionCallbacks = new Set<(connectionId: string) => void>()
  let wasConnected = false
  let sessionRefreshTimer: ReturnType<typeof setInterval> | null = null
  let disconnectTimer: ReturnType<typeof setTimeout> | null = null

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
    handler: subscriptionHandler,
    createKey: createSubscriptionKey,
    onError: (error) => onError?.(error),
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

    socket.addEventListener('close', () => {
      if (socket !== thisSocket) {
        return
      }
      stopSessionRefreshTimer()
      // Ignore close events after intentional disconnect (socket already nulled)
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      if (!socket) {
        return
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
