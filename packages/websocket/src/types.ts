/**
 * Core types for generic WebSocket client functionality
 */

import type { ConnectionStore } from '@universe/websocket/src/store/types'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

/**
 * Minimal interface for WebSocket-like objects.
 * Allows injection of mock WebSocket implementations for testing.
 */
export interface WebSocketLike {
  readyState: number
  addEventListener(event: string, handler: (event: unknown) => void): void
  close(): void
  /** PartySocket extension: re-arms the retry loop after an explicit close(). */
  reconnect?(): void
}

/**
 * Options for creating a WebSocket connection.
 * These match the options expected by PartySocket.
 */
export interface SocketFactoryOptions {
  maxReconnectionDelay: number
  minReconnectionDelay: number
  reconnectionDelayGrowFactor: number
  connectionTimeout: number
  maxRetries: number
  debug: boolean
}

export interface ConnectionConfig {
  url: string
  maxReconnectionDelay?: number
  minReconnectionDelay?: number
  connectionTimeout?: number
  maxRetries?: number
  debug?: boolean
  /** Close codes meaning the server shed this connection on purpose (default [1013]). */
  overloadCloseCodes?: number[]
  /** Base hold-off (ms) before the single retry after an overload close (default 60s, +50% jitter). */
  overloadRetryDelayMs?: number
}

/**
 * Subscription handler - consumers provide REST API implementation
 * for managing server-side subscription lifecycle
 */
/** Methods reject on failure; reject with ConnectionGoneError when the server no longer knows the connection. */
export interface SubscriptionHandler<TParams = unknown> {
  subscribe: (connectionId: string, params: TParams) => Promise<void>
  unsubscribe: (connectionId: string, params: TParams) => Promise<void>
  subscribeBatch?: (connectionId: string, params: TParams[]) => Promise<void>
  unsubscribeBatch?: (connectionId: string, params: TParams[]) => Promise<void>
  refreshSession?: (connectionId: string) => Promise<void>
}

export interface SubscriptionOptions<TParams, TMessage> {
  channel: string
  params: TParams
  onMessage?: (message: TMessage) => void
}

export interface WebSocketClient<TParams = unknown, TMessage = unknown> {
  isConnected: () => boolean
  getConnectionStatus: () => ConnectionStatus
  getConnectionId: () => string | null
  subscribe: (options: SubscriptionOptions<TParams, TMessage>) => () => void
  onStatusChange: (callback: (status: ConnectionStatus) => void) => () => void
  onConnectionEstablished: (callback: (connectionId: string) => void) => () => void
}

export interface CreateWebSocketClientOptions<TParams, TMessage> {
  config: ConnectionConfig
  connectionStore: ConnectionStore
  subscriptionHandler: SubscriptionHandler<TParams>
  parseMessage: (raw: unknown) => { channel: string; key: string; data: TMessage } | null
  parseConnectionMessage: (raw: unknown) => { connectionId: string } | null
  createSubscriptionKey: (channel: string, params: TParams) => string
  /** `operation` names the subscription RPC that failed; absent for socket-level errors. */
  onError?: (error: unknown, operation?: string) => void
  onRawMessage?: (message: unknown) => void
  /**
   * Interval (ms) for automatically refreshing the server session.
   * When set, the client starts a timer on connect and stops it on disconnect.
   * Requires the subscriptionHandler to implement refreshSession.
   */
  sessionRefreshIntervalMs?: number
  /**
   * Optional factory for creating WebSocket instances.
   * Defaults to PartySocket. Primarily used for testing with mock WebSockets.
   */
  socketFactory?: (url: string, options: SocketFactoryOptions) => WebSocketLike
}
