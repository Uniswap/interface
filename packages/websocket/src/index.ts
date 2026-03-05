// Main factory function
export { createWebSocketClient } from './client/createWebSocketClient'
export { createZustandConnectionStore } from './store/createZustandConnectionStore'
// Store types (for consumers who need to access connection state)
export type { ConnectionStore, CreateZustandConnectionStoreOptions } from './store/types'
// Additional exports for advanced use cases
export { SubscriptionManager } from './subscriptions/SubscriptionManager'
// Subscription types (for consumers building custom subscription logic)
export type { SubscribeInput, SubscriptionEntry, SubscriptionManagerOptions } from './subscriptions/types'
export type {
  ConnectionConfig,
  ConnectionStatus,
  CreateWebSocketClientOptions,
  SocketFactoryOptions,
  SubscriptionHandler,
  SubscriptionOptions,
  WebSocketClient,
  // For testing/mocking
  WebSocketLike,
} from './types'
// Utility functions
export { addJitter, getDefaultJitteredDelay } from './utils/backoff'
