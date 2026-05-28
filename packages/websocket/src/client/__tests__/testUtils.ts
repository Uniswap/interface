import { MockWebSocket } from '@universe/websocket/src/client/__tests__/MockWebSocket'
import { createWebSocketClient } from '@universe/websocket/src/client/createWebSocketClient'
import { createZustandConnectionStore } from '@universe/websocket/src/store/createZustandConnectionStore'
import type { ConnectionStore } from '@universe/websocket/src/store/types'
import type { CreateWebSocketClientOptions, WebSocketClient } from '@universe/websocket/src/types'
import { vi } from 'vitest'

export interface TestParams {
  channel: string
  id: string
}

export interface TestMessage {
  data: string
  price?: number
}

interface TestHandler {
  subscribe: ReturnType<typeof vi.fn>
  unsubscribe: ReturnType<typeof vi.fn>
  subscribeBatch: ReturnType<typeof vi.fn>
  unsubscribeBatch: ReturnType<typeof vi.fn>
  refreshSession: ReturnType<typeof vi.fn>
}

interface TestClientResult {
  client: WebSocketClient<TestParams, TestMessage>
  mockSocket: MockWebSocket
  handler: TestHandler
  connectionStore: ConnectionStore
}

/**
 * Creates a test WebSocket client with mocked dependencies.
 * Returns the client, mock socket, mock handler, and connection store for assertions.
 */
export function createTestClient(
  overrides?: Partial<CreateWebSocketClientOptions<TestParams, TestMessage>>,
): TestClientResult {
  const mockSocket = new MockWebSocket()
  const connectionStore = createZustandConnectionStore()

  const handler: TestHandler = {
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    subscribeBatch: vi.fn().mockResolvedValue(undefined),
    unsubscribeBatch: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(undefined),
  }

  const client = createWebSocketClient<TestParams, TestMessage>({
    config: { url: 'wss://test.example.com' },
    connectionStore,
    subscriptionHandler: overrides?.subscriptionHandler ?? handler,
    parseMessage: (raw) => {
      const msg = raw as { channel?: string; key?: string; data?: TestMessage }
      if (msg.channel && msg.key && msg.data) {
        return { channel: msg.channel, key: msg.key, data: msg.data }
      }
      return null
    },
    parseConnectionMessage: (raw) => {
      const msg = raw as { type?: string; connectionId?: string }
      if (msg.type === 'connected' && msg.connectionId) {
        return { connectionId: msg.connectionId }
      }
      return null
    },
    createSubscriptionKey: (channel, params) => `${channel}:${params.id}`,
    socketFactory: () => mockSocket,
    ...overrides,
  })

  return { client, mockSocket, handler, connectionStore }
}

interface ConnectViaSubscribeOptions {
  client: WebSocketClient<TestParams, TestMessage>
  mockSocket: MockWebSocket
  connectionId?: string
}

/**
 * Triggers a connection by subscribing, then simulates socket open and connection message.
 * Returns the unsubscribe function from the subscription that triggered the connection.
 */
export function connectViaSubscribe(options: ConnectViaSubscribeOptions): () => void {
  const { client, mockSocket, connectionId = 'conn-123' } = options
  const unsub = client.subscribe({
    channel: '__connect',
    params: { channel: '__connect', id: '__connect' },
    onMessage: vi.fn(),
  })
  mockSocket.simulateOpen()
  mockSocket.simulateMessage({ type: 'connected', connectionId })
  return unsub
}

/**
 * Flush all pending microtasks and promises.
 */
export async function flushMicrotasks(): Promise<void> {
  // queueMicrotask runs before setTimeout, but we need to also flush
  // any promises that are scheduled from within those microtasks
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Flush all pending promises in the microtask queue.
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
