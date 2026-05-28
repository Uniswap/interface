# @universe/websocket

A generic, type-safe WebSocket client with built-in subscription management, automatic reconnection, and reference counting.

## Features

- **Lazy connection lifecycle** - Connects on first subscribe, disconnects on last unsubscribe
- **Microtask batching** - Coalesces subscribe/unsubscribe calls within the same microtask via `queueMicrotask`
- **Subscription deduplication** - Multiple subscribers to the same params share one subscription via reference counting
- **Auto-resubscribe** - Automatically resubscribes all active subscriptions after reconnection
- **Message routing** - Routes incoming messages to appropriate subscriber callbacks
- **Type-safe** - Full TypeScript generics for params and message types
- **Framework agnostic** - Works with any framework; consumers provide their own REST handlers

## Installation

```bash
bun add @universe/websocket
```

## Quick Start

```typescript
import { createWebSocketClient } from '@universe/websocket'

// Define your param and message types
interface PriceParams {
  tokenAddress: string
  chainId: number
}

interface PriceMessage {
  price: number
  timestamp: number
}

// Create the client
const client = createWebSocketClient<PriceParams, PriceMessage>({
  config: {
    url: 'wss://api.example.com/ws',
  },
  subscriptionHandler: {
    subscribe: async (connectionId, params) => {
      await fetch('/api/subscribe', {
        method: 'POST',
        body: JSON.stringify({ connectionId, ...params }),
      })
    },
    unsubscribe: async (connectionId, params) => {
      await fetch('/api/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ connectionId, ...params }),
      })
    },
    // Optional: batch subscribe/unsubscribe for efficiency
    subscribeBatch: async (connectionId, paramsList) => {
      await fetch('/api/subscribe-batch', {
        method: 'POST',
        body: JSON.stringify({ connectionId, subscriptions: paramsList }),
      })
    },
    unsubscribeBatch: async (connectionId, paramsList) => {
      await fetch('/api/unsubscribe-batch', {
        method: 'POST',
        body: JSON.stringify({ connectionId, subscriptions: paramsList }),
      })
    },
  },
  parseConnectionMessage: (raw) => {
    if (raw && typeof raw === 'object' && 'connectionId' in raw) {
      return { connectionId: raw.connectionId as string }
    }
    return null
  },
  parseMessage: (raw) => {
    if (raw && typeof raw === 'object' && 'channel' in raw && 'data' in raw) {
      const msg = raw as { channel: string; tokenAddress: string; chainId: number; data: PriceMessage }
      return {
        channel: msg.channel,
        key: `${msg.channel}:${msg.tokenAddress}:${msg.chainId}`,
        data: msg.data,
      }
    }
    return null
  },
  createSubscriptionKey: (channel, params) => `${channel}:${params.tokenAddress}:${params.chainId}`,
})

// Subscribe — connection opens automatically on first subscribe
const unsubscribe = client.subscribe({
  channel: 'prices',
  params: { tokenAddress: '0x...', chainId: 1 },
  onMessage: (message) => {
    console.log('Price update:', message.price)
  },
})

// Later: unsubscribe — connection closes automatically when last subscriber leaves
unsubscribe()
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocketClient                          │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │  PartySocket    │  │     SubscriptionManager         │  │
│  │  (connection)   │  │  - Reference counting           │  │
│  │                 │  │  - Microtask batching            │  │
│  │                 │  │  - Auto-resubscribe             │  │
│  │                 │  │  - Message dispatch             │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ConnectionStore (Zustand)              │   │
│  │  - status: disconnected|connecting|connected|...    │   │
│  │  - connectionId: string | null                      │   │
│  │  - error: Error | null                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Consumer-provided handlers
                    (REST subscribe/unsubscribe)
```

## Lazy Connection Lifecycle

The client manages its WebSocket connection automatically:

1. **First subscribe** - Opens WebSocket connection
2. **Connection established** - Receives connectionId, resubscribes all queued subscriptions
3. **Last unsubscribe** - Closes WebSocket connection and cleans up state

There are no `connect()` or `disconnect()` methods — the connection lifecycle is driven entirely by subscription activity.

## API Reference

### `createWebSocketClient<TParams, TMessage>(options)`

Creates a new WebSocket client instance.

#### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `config` | `ConnectionConfig` | Yes | Connection configuration |
| `subscriptionHandler` | `SubscriptionHandler<TParams>` | Yes | REST API handlers for subscribe/unsubscribe |
| `parseMessage` | `(raw: unknown) => { channel, key, data } \| null` | Yes | Parse incoming WebSocket messages |
| `parseConnectionMessage` | `(raw: unknown) => { connectionId } \| null` | Yes | Parse connection established message |
| `createSubscriptionKey` | `(channel, params) => string` | Yes | Create unique key for subscription deduplication |
| `onError` | `(error: unknown) => void` | No | Error callback |
| `onRawMessage` | `(message: unknown) => void` | No | Raw message callback (for external caching or debugging) |

#### SubscriptionHandler

| Method | Type | Required | Description |
|--------|------|----------|-------------|
| `subscribe` | `(connectionId, params) => Promise<void>` | Yes | Subscribe to a single channel |
| `unsubscribe` | `(connectionId, params) => Promise<void>` | Yes | Unsubscribe from a single channel |
| `subscribeBatch` | `(connectionId, params[]) => Promise<void>` | No | Subscribe to multiple channels at once |
| `unsubscribeBatch` | `(connectionId, params[]) => Promise<void>` | No | Unsubscribe from multiple channels at once |
| `refreshSession` | `(connectionId) => Promise<void>` | No | Refresh the session |

When `subscribeBatch`/`unsubscribeBatch` are provided, batched calls use them. Otherwise, individual `subscribe`/`unsubscribe` calls are made for each param in the batch.

#### ConnectionConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | - | WebSocket URL |
| `maxReconnectionDelay` | `number` | `10000` | Maximum delay (ms) between reconnection attempts |
| `minReconnectionDelay` | `number` | `1000` | Minimum delay (ms) before jitter is applied |
| `connectionTimeout` | `number` | `4000` | Time (ms) to wait for connection |
| `maxRetries` | `number` | `5` | Maximum reconnection attempts |
| `debug` | `boolean` | `false` | Enable debug logging |

#### Returns: `WebSocketClient<TParams, TMessage>`

| Method | Description |
|--------|-------------|
| `isConnected()` | Check if currently connected |
| `getConnectionStatus()` | Get current status: `'disconnected' \| 'connecting' \| 'connected' \| 'reconnecting'` |
| `getConnectionId()` | Get current connection ID or null |
| `subscribe(options)` | Subscribe to a channel, returns unsubscribe function |
| `onStatusChange(callback)` | Listen to status changes, returns cleanup function |
| `onConnectionEstablished(callback)` | Listen to connection events, returns cleanup function |

#### SubscriptionOptions

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `channel` | `string` | Yes | Channel name |
| `params` | `TParams` | Yes | Subscription parameters |
| `onMessage` | `(message: TMessage) => void` | No | Callback for incoming messages. Omit when using `onRawMessage` for external cache population. |

### `SubscriptionManager<TParams, TMessage>`

Lower-level subscription manager with reference counting and microtask batching. Used internally by `createWebSocketClient`, but can be used directly for custom implementations.

```typescript
import { SubscriptionManager } from '@universe/websocket'

const manager = new SubscriptionManager<MyParams, MyMessage>({
  handler: subscriptionHandler,
  createKey: (channel, params) => `${channel}:${params.id}`,
  onError: (error, operation) => console.error(operation, error),
  onSubscriptionCountChange: (count) => {
    // React to subscription count changes (e.g., lazy connect/disconnect)
  },
})
```

## Microtask Batching

Subscribe and unsubscribe calls are batched within the same microtask using `queueMicrotask`:

```typescript
// These three subscribes are coalesced into a single subscribeBatch call
const unsub1 = client.subscribe({ channel: 'prices', params: paramsA, onMessage: handleA })
const unsub2 = client.subscribe({ channel: 'prices', params: paramsB, onMessage: handleB })
const unsub3 = client.subscribe({ channel: 'events', params: paramsC, onMessage: handleC })
// ^ After the microtask flushes: one subscribeBatch([paramsA, paramsB, paramsC]) call

// Subscribe + immediate unsubscribe in the same microtask = net-zero API calls
const unsub = client.subscribe({ channel: 'prices', params: paramsA, onMessage: handle })
unsub()
// ^ The pending subscribe and unsubscribe cancel each other out — no REST calls made
```

## How Reference Counting Works

When multiple components subscribe to the same params:

1. **First subscriber** - Queues REST subscribe API call
2. **Additional subscribers** - Just adds callback, no REST call
3. **Subscriber leaves** - Removes callback
4. **Last subscriber leaves** - Queues REST unsubscribe API call

```typescript
// Component A subscribes - REST subscribe queued
const unsubA = client.subscribe({ channel: 'prices', params, onMessage: handleA })

// Component B subscribes to same params - no REST call, shares subscription
const unsubB = client.subscribe({ channel: 'prices', params, onMessage: handleB })

// Component A unsubscribes - just removes callback
unsubA()

// Component B unsubscribes - REST unsubscribe queued (last subscriber)
unsubB()
```

## Reconnection Behavior

The client uses jittered exponential backoff to prevent thundering herd:

1. Connection drops -> status becomes `'reconnecting'`
2. Waits `minDelay + random(0, 4000)ms` before first attempt
3. Each subsequent attempt multiplies delay by 1.3x (up to `maxDelay`)
4. On successful reconnect, automatically resubscribes all active subscriptions
5. After `maxRetries` failures, stops attempting

## Development

```bash
# Run tests
bun websocket test

# Type check
bun websocket typecheck

# Lint
bun websocket lint:fix
```
