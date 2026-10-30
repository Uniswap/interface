import { MockWebSocket } from '@universe/websocket/src/client/__tests__/MockWebSocket'
import { createWebSocketClient } from '@universe/websocket/src/client/createWebSocketClient'
import { ConnectionGoneError } from '@universe/websocket/src/errors'
import { createZustandConnectionStore } from '@universe/websocket/src/store/createZustandConnectionStore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const GONE = new ConnectionGoneError('conn-1')
const REFRESH_INTERVAL_MS = 60_000
const REVIVE_JITTER_MS = 2_000

function createHarness(refreshSession = vi.fn().mockRejectedValue(GONE)) {
  const sockets: MockWebSocket[] = []
  const handler = {
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    subscribeBatch: vi.fn().mockResolvedValue(undefined),
    unsubscribeBatch: vi.fn().mockResolvedValue(undefined),
    refreshSession,
  }
  const onError = vi.fn()
  const client = createWebSocketClient<{ id: string }, unknown>({
    config: { url: 'wss://test.example.com' },
    connectionStore: createZustandConnectionStore(),
    subscriptionHandler: handler,
    sessionRefreshIntervalMs: REFRESH_INTERVAL_MS,
    onError,
    parseMessage: () => null,
    parseConnectionMessage: (raw) => {
      const msg = raw as { type?: string; connectionId?: string }
      return msg.type === 'connected' && msg.connectionId ? { connectionId: msg.connectionId } : null
    },
    createSubscriptionKey: (channel, params) => `${channel}:${params.id}`,
    socketFactory: () => {
      const socket = new MockWebSocket()
      sockets.push(socket)
      return socket
    },
  })
  return { client, sockets, handler, onError }
}

async function open(socket: MockWebSocket | undefined, connectionId: string): Promise<void> {
  socket?.simulateOpen()
  socket?.simulateMessage({ type: 'connected', connectionId })
  await vi.advanceTimersByTimeAsync(0)
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('connection the server no longer knows', () => {
  it('replaces a socket that still reads OPEN once refreshes keep failing as gone', async () => {
    const h = createHarness()
    const unsub = h.client.subscribe({ channel: 'price', params: { id: 'tok' } })
    await vi.advanceTimersByTimeAsync(0)
    await open(h.sockets[0], 'conn-1')

    await vi.advanceTimersByTimeAsync(REFRESH_INTERVAL_MS)
    expect(h.sockets).toHaveLength(1)
    expect(h.onError).toHaveBeenCalledWith(GONE, 'refreshSession')

    await vi.advanceTimersByTimeAsync(REFRESH_INTERVAL_MS + REVIVE_JITTER_MS)
    expect(h.sockets).toHaveLength(2)
    expect(h.sockets[0]?.closeCalls).toBe(1)

    await open(h.sockets[1], 'conn-2')
    expect(h.handler.subscribeBatch).toHaveBeenLastCalledWith('conn-2', [{ id: 'tok' }])
    expect(h.client.getConnectionId()).toBe('conn-2')

    unsub()
  })

  it('keeps the socket when refreshes succeed between gone failures', async () => {
    const refresh = vi.fn().mockRejectedValueOnce(GONE).mockResolvedValueOnce(undefined).mockRejectedValueOnce(GONE)
    const h = createHarness(refresh)
    const unsub = h.client.subscribe({ channel: 'price', params: { id: 'tok' } })
    await vi.advanceTimersByTimeAsync(0)
    await open(h.sockets[0], 'conn-1')

    await vi.advanceTimersByTimeAsync(3 * REFRESH_INTERVAL_MS + REVIVE_JITTER_MS)
    expect(h.sockets).toHaveLength(1)

    unsub()
  })
})
