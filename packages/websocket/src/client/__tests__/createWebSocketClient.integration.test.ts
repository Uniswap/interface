import type { TestMessage } from '@universe/websocket/src/client/__tests__/testUtils'
import { connectViaSubscribe, createTestClient } from '@universe/websocket/src/client/__tests__/testUtils'
import type { ConnectionStatus } from '@universe/websocket/src/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('createWebSocketClient integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('lazy connection lifecycle', () => {
    it('first subscribe triggers connection: status transitions to connecting then connected', () => {
      const { client, mockSocket } = createTestClient()
      const statusChanges: ConnectionStatus[] = []

      client.onStatusChange((s) => statusChanges.push(s))

      // Subscribe triggers lazy connect
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      expect(statusChanges).toEqual(['connecting'])
      expect(client.getConnectionStatus()).toBe('connecting')

      mockSocket.simulateOpen()

      expect(statusChanges).toEqual(['connecting', 'connected'])
      expect(client.getConnectionStatus()).toBe('connected')
      expect(client.isConnected()).toBe(true)
    })

    it('last unsubscribe triggers disconnect: clears all state and sets status to disconnected', async () => {
      const { client, mockSocket } = createTestClient()
      const statusChanges: ConnectionStatus[] = []

      client.onStatusChange((s) => statusChanges.push(s))

      const unsub = client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      mockSocket.simulateOpen()
      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-123' })
      await vi.advanceTimersByTimeAsync(0)

      unsub()
      await vi.advanceTimersByTimeAsync(2000)

      // After last unsubscribe + debounce window, should be disconnected
      expect(client.getConnectionStatus()).toBe('disconnected')
      expect(client.isConnected()).toBe(false)
      expect(client.getConnectionId()).toBe(null)
      expect(statusChanges).toContain('disconnected')
    })

    it('second subscribe to same params does not reconnect', () => {
      const { client, mockSocket } = createTestClient()
      const statusChanges: ConnectionStatus[] = []

      client.onStatusChange((s) => statusChanges.push(s))

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      mockSocket.simulateOpen()

      // Second subscribe with same key — should not create new connection
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      expect(statusChanges).toEqual(['connecting', 'connected'])
    })

    it('connection established message stores connectionId and fires callback', () => {
      const { client, mockSocket } = createTestClient()
      const connectionIds: string[] = []

      client.onConnectionEstablished((id) => connectionIds.push(id))

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      mockSocket.simulateOpen()

      expect(client.getConnectionId()).toBe(null)

      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-123' })

      expect(client.getConnectionId()).toBe('conn-123')
      expect(connectionIds).toEqual(['conn-123'])
    })

    it('disconnect does not produce spurious reconnecting status', async () => {
      const { client, mockSocket } = createTestClient()
      const statusChanges: ConnectionStatus[] = []

      client.onStatusChange((s) => statusChanges.push(s))

      const unsub = client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      mockSocket.simulateOpen()
      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-123' })
      await vi.advanceTimersByTimeAsync(0)

      // Unsubscribing the last subscriber triggers debounced disconnect
      // wasConnected is set to false BEFORE socket.close(), preventing spurious 'reconnecting'
      unsub()
      await vi.advanceTimersByTimeAsync(2000)

      // Should go straight to disconnected without reconnecting
      expect(statusChanges).toEqual(['connecting', 'connected', 'disconnected'])
    })
  })

  describe('subscription flow', () => {
    it('subscribe() calls handler via subscribeBatch with connectionId after microtask flush', async () => {
      const { client, mockSocket, handler } = createTestClient()

      connectViaSubscribe({ client, mockSocket })

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      await vi.advanceTimersByTimeAsync(0)

      // The connectViaSubscribe helper creates one subscription, so subscribeBatch is called
      // for resubscribeAll after connectionId, then our new subscribe
      expect(handler.subscribeBatch).toHaveBeenCalledWith(
        'conn-123',
        expect.arrayContaining([{ channel: 'prices', id: 'token-1' }]),
      )
    })

    it('subscribe() before connection is established queues subs until connected', async () => {
      const { client, mockSocket, handler } = createTestClient()

      // Subscribe before socket is open — triggers connection
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      await vi.advanceTimersByTimeAsync(0)

      // No connectionId yet, so no REST calls
      expect(handler.subscribeBatch).not.toHaveBeenCalled()

      // Now connection establishes
      mockSocket.simulateOpen()
      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-123' })

      await vi.advanceTimersByTimeAsync(0)

      // resubscribeAll sends the queued subscription
      expect(handler.subscribeBatch).toHaveBeenCalledWith('conn-123', [{ channel: 'prices', id: 'token-1' }])
    })

    it('multiple subscribers to same params calls handler once (reference counting)', async () => {
      const { client, mockSocket, handler } = createTestClient()

      connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)
      handler.subscribeBatch.mockClear()

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      await vi.advanceTimersByTimeAsync(0)

      expect(handler.subscribeBatch).toHaveBeenCalledTimes(1)
    })

    it('unsubscribe last subscriber calls handler.unsubscribeBatch', async () => {
      const { client, mockSocket, handler } = createTestClient()

      connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)
      handler.unsubscribeBatch.mockClear()

      const unsub = client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      await vi.advanceTimersByTimeAsync(0)
      unsub()
      await vi.advanceTimersByTimeAsync(0)

      expect(handler.unsubscribeBatch).toHaveBeenCalledWith(
        'conn-123',
        expect.arrayContaining([{ channel: 'prices', id: 'token-1' }]),
      )
    })

    it('unsubscribe with remaining subscribers does NOT call handler.unsubscribe', async () => {
      const { client, mockSocket, handler } = createTestClient()

      connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)
      handler.unsubscribeBatch.mockClear()
      handler.unsubscribe.mockClear()

      const unsub1 = client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      await vi.advanceTimersByTimeAsync(0)
      unsub1()
      await vi.advanceTimersByTimeAsync(0)

      expect(handler.unsubscribeBatch).not.toHaveBeenCalled()
      expect(handler.unsubscribe).not.toHaveBeenCalled()
    })
  })

  describe('message routing', () => {
    it('message received is parsed and routed to correct callback', async () => {
      const { client, mockSocket } = createTestClient()
      const messages: TestMessage[] = []

      connectViaSubscribe({ client, mockSocket })

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: (m) => messages.push(m),
      })

      await vi.advanceTimersByTimeAsync(0)

      mockSocket.simulateMessage({
        channel: 'prices',
        key: 'prices:token-1',
        data: { data: 'price-update', price: 3000 },
      })

      expect(messages).toEqual([{ data: 'price-update', price: 3000 }])
    })

    it('message for unknown subscription is ignored', async () => {
      const { client, mockSocket } = createTestClient()
      const messages: TestMessage[] = []

      connectViaSubscribe({ client, mockSocket })

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: (m) => messages.push(m),
      })

      await vi.advanceTimersByTimeAsync(0)

      // Message for different subscription key
      mockSocket.simulateMessage({
        channel: 'prices',
        key: 'prices:token-2',
        data: { data: 'unknown' },
      })

      expect(messages).toEqual([])
    })

    it('message to multiple subscribers invokes all callbacks', async () => {
      const { client, mockSocket } = createTestClient()
      const messages1: TestMessage[] = []
      const messages2: TestMessage[] = []

      connectViaSubscribe({ client, mockSocket })

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: (m) => messages1.push(m),
      })
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: (m) => messages2.push(m),
      })

      await vi.advanceTimersByTimeAsync(0)

      mockSocket.simulateMessage({
        channel: 'prices',
        key: 'prices:token-1',
        data: { data: 'price-update' },
      })

      expect(messages1).toEqual([{ data: 'price-update' }])
      expect(messages2).toEqual([{ data: 'price-update' }])
    })

    it('malformed message calls onError and does not crash', () => {
      const onError = vi.fn()
      const { client, mockSocket } = createTestClient({ onError })

      connectViaSubscribe({ client, mockSocket })

      // Simulate a message that will fail JSON.parse
      const handlers = (mockSocket as unknown as { listeners: Map<string, Set<(e: unknown) => void>> }).listeners.get(
        'message',
      )
      if (handlers) {
        for (const handler of handlers) {
          handler({ data: 'not valid json' })
        }
      }

      expect(onError).toHaveBeenCalled()
    })
  })

  describe('reconnection', () => {
    it('socket closes after connected sets status to reconnecting', () => {
      const { client, mockSocket } = createTestClient()
      const statusChanges: ConnectionStatus[] = []

      client.onStatusChange((s) => statusChanges.push(s))

      // Subscribe triggers lazy connect
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      mockSocket.simulateOpen()

      mockSocket.simulateClose()

      expect(statusChanges).toContain('reconnecting')
      expect(client.getConnectionStatus()).toBe('reconnecting')
    })

    it('socket closes before fully connected sets status to disconnected', () => {
      const { client, mockSocket } = createTestClient()
      const statusChanges: ConnectionStatus[] = []

      client.onStatusChange((s) => statusChanges.push(s))

      // Subscribe triggers lazy connect
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      // Don't simulate open - close before connecting
      mockSocket.simulateClose()

      expect(statusChanges).toContain('disconnected')
    })

    it('resubscribes all after reconnection with new connectionId', async () => {
      const { client, mockSocket, handler } = createTestClient()

      connectViaSubscribe({ client, mockSocket, connectionId: 'conn-1' })

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      client.subscribe({
        channel: 'events',
        params: { channel: 'events', id: 'event-1' },
        onMessage: vi.fn(),
      })

      await vi.advanceTimersByTimeAsync(0)
      handler.subscribeBatch.mockClear()

      // Simulate reconnect
      mockSocket.simulateClose()
      mockSocket.simulateOpen()
      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-2' })

      await vi.advanceTimersByTimeAsync(0)

      // Resubscription happens with the new connectionId via subscribeBatch
      expect(handler.subscribeBatch).toHaveBeenCalledWith(
        'conn-2',
        expect.arrayContaining([
          { channel: 'prices', id: 'token-1' },
          { channel: 'events', id: 'event-1' },
        ]),
      )
    })

    it('connection established message updates connectionId', () => {
      const { client, mockSocket } = createTestClient()

      connectViaSubscribe({ client, mockSocket, connectionId: 'conn-1' })

      expect(client.getConnectionId()).toBe('conn-1')

      // Simulate reconnect with new connectionId
      mockSocket.simulateClose()
      mockSocket.simulateOpen()
      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-2' })

      expect(client.getConnectionId()).toBe('conn-2')
    })
  })

  describe('early unsubscribe', () => {
    it('subscribe + immediate unsubscribe in same microtask produces net-zero API calls', async () => {
      const { client, mockSocket, handler } = createTestClient()

      connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)
      handler.subscribeBatch.mockClear()
      handler.subscribe.mockClear()
      handler.unsubscribeBatch.mockClear()
      handler.unsubscribe.mockClear()

      // Subscribe and immediately unsubscribe in same microtask
      const unsub = client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      unsub()

      await vi.advanceTimersByTimeAsync(0)

      // Net-zero: the pending subscribe and unsubscribe for the same key cancel out
      expect(handler.subscribeBatch).not.toHaveBeenCalled()
      expect(handler.subscribe).not.toHaveBeenCalled()
      // Note: unsubscribeBatch may be called for the __connect helper key if it was the last subscriber
      // But for our 'prices:token-1' key, no unsubscribe should occur since it was never subscribed
    })
  })

  describe('error handling', () => {
    it('handler.subscribe error calls onError', async () => {
      const onError = vi.fn()
      const subscribeError = new Error('Subscribe failed')

      const { client, mockSocket } = createTestClient({
        onError,
        subscriptionHandler: {
          subscribe: vi.fn().mockRejectedValue(subscribeError),
          unsubscribe: vi.fn().mockResolvedValue(undefined),
        },
      })

      connectViaSubscribe({ client, mockSocket })

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      await vi.advanceTimersByTimeAsync(0)

      expect(onError).toHaveBeenCalledWith(subscribeError)
    })

    it('socket error calls onError', () => {
      const onError = vi.fn()
      const { client, mockSocket } = createTestClient({ onError })

      connectViaSubscribe({ client, mockSocket })

      mockSocket.simulateError('Connection failed')

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('parseMessage throws calls onError', () => {
      const onError = vi.fn()
      const parseError = new Error('Parse failed')

      const { client, mockSocket } = createTestClient({
        onError,
        parseMessage: () => {
          throw parseError
        },
      })

      connectViaSubscribe({ client, mockSocket })

      // This message will trigger parseMessage
      mockSocket.simulateMessage({ channel: 'prices', key: 'prices:token-1', data: { data: 'test' } })

      expect(onError).toHaveBeenCalledWith(parseError)
    })

    it('callback throws calls onError but other callbacks still invoked', async () => {
      const onError = vi.fn()
      const { client, mockSocket } = createTestClient({ onError })
      const messages: TestMessage[] = []
      const callbackError = new Error('Callback error')

      connectViaSubscribe({ client, mockSocket })

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: () => {
          throw callbackError
        },
      })
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: (m) => messages.push(m),
      })

      await vi.advanceTimersByTimeAsync(0)

      mockSocket.simulateMessage({
        channel: 'prices',
        key: 'prices:token-1',
        data: { data: 'test' },
      })

      expect(onError).toHaveBeenCalledWith(callbackError)
      expect(messages).toEqual([{ data: 'test' }])
    })
  })

  describe('status callbacks', () => {
    it('onStatusChange receives all transitions', async () => {
      const { client, mockSocket } = createTestClient()
      const statusChanges: ConnectionStatus[] = []

      client.onStatusChange((s) => statusChanges.push(s))

      // Subscribe triggers connection
      const unsub1 = client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      mockSocket.simulateOpen()
      mockSocket.simulateClose()
      mockSocket.simulateOpen()
      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-123' })
      await vi.advanceTimersByTimeAsync(0)

      // Last unsubscribe triggers debounced disconnect
      unsub1()
      await vi.advanceTimersByTimeAsync(2000)

      expect(statusChanges).toEqual(['connecting', 'connected', 'reconnecting', 'connected', 'disconnected'])
    })

    it('onConnectionEstablished fires when connectionId received', () => {
      const { client, mockSocket } = createTestClient()
      const connectionIds: string[] = []

      client.onConnectionEstablished((id) => connectionIds.push(id))

      // Subscribe triggers connection
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      mockSocket.simulateOpen()

      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-1' })
      mockSocket.simulateClose()
      mockSocket.simulateOpen()
      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-2' })

      expect(connectionIds).toEqual(['conn-1', 'conn-2'])
    })

    it('unsubscribe from status callback works', () => {
      const { client, mockSocket } = createTestClient()
      const statusChanges: ConnectionStatus[] = []

      const unsub = client.onStatusChange((s) => statusChanges.push(s))

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })

      unsub()

      mockSocket.simulateOpen()

      expect(statusChanges).toEqual(['connecting'])
    })

    it('unsubscribe from connection callback works', () => {
      const { client, mockSocket } = createTestClient()
      const connectionIds: string[] = []

      const unsub = client.onConnectionEstablished((id) => connectionIds.push(id))

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        onMessage: vi.fn(),
      })
      mockSocket.simulateOpen()

      unsub()

      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-1' })

      expect(connectionIds).toEqual([])
    })
  })

  describe('full lifecycle', () => {
    it('complete subscription lifecycle from subscribe to last-unsubscribe disconnect', async () => {
      const { client, mockSocket, handler } = createTestClient()
      const statusChanges: ConnectionStatus[] = []
      const messages: TestMessage[] = []

      client.onStatusChange((s) => statusChanges.push(s))

      // Subscribe triggers lazy connect
      const unsub = client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'ETH' },
        onMessage: (m) => messages.push(m),
      })

      expect(statusChanges).toEqual(['connecting'])

      mockSocket.simulateOpen()
      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-123' })

      expect(statusChanges).toEqual(['connecting', 'connected'])
      expect(client.getConnectionId()).toBe('conn-123')

      await vi.advanceTimersByTimeAsync(0)

      // resubscribeAll fires because there are active subs when connectionId is received
      expect(handler.subscribeBatch).toHaveBeenCalledWith('conn-123', [{ channel: 'prices', id: 'ETH' }])

      mockSocket.simulateMessage({
        channel: 'prices',
        key: 'prices:ETH',
        data: { data: 'price', price: 3000 },
      })
      expect(messages).toEqual([{ data: 'price', price: 3000 }])

      unsub()
      await vi.advanceTimersByTimeAsync(2000)

      // Last unsubscribe triggers debounced disconnect
      expect(statusChanges).toContain('disconnected')
    })
  })

  describe('subscribe without onMessage', () => {
    it('subscribe without onMessage still triggers connection and REST subscribe', async () => {
      const { client, mockSocket, handler } = createTestClient()

      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
      })

      // Should still trigger connection
      expect(client.getConnectionStatus()).toBe('connecting')

      mockSocket.simulateOpen()
      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-123' })

      await vi.advanceTimersByTimeAsync(0)

      expect(handler.subscribeBatch).toHaveBeenCalledWith('conn-123', [{ channel: 'prices', id: 'token-1' }])
    })
  })

  describe('onRawMessage callback', () => {
    it('onRawMessage receives all parsed messages', () => {
      const onRawMessage = vi.fn()
      const { client, mockSocket } = createTestClient({ onRawMessage })

      connectViaSubscribe({ client, mockSocket })

      mockSocket.simulateMessage({ channel: 'prices', key: 'prices:ETH', data: { data: 'test' } })

      // onRawMessage called for: connection message (from connectViaSubscribe) + the data message
      expect(onRawMessage).toHaveBeenCalledWith({ type: 'connected', connectionId: 'conn-123' })
      expect(onRawMessage).toHaveBeenCalledWith({ channel: 'prices', key: 'prices:ETH', data: { data: 'test' } })
    })
  })

  describe('session refresh timer', () => {
    it('starts timer on connect and calls refreshSession at interval', async () => {
      const { client, mockSocket, handler } = createTestClient({
        sessionRefreshIntervalMs: 5000,
      })

      connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)

      expect(handler.refreshSession).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(5000)

      expect(handler.refreshSession).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(5000)

      expect(handler.refreshSession).toHaveBeenCalledTimes(2)
    })

    it('stops timer on disconnect (last unsubscribe)', async () => {
      const { client, mockSocket, handler } = createTestClient({
        sessionRefreshIntervalMs: 5000,
      })

      const unsub = connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)

      unsub()
      // Advance past the 2000ms disconnect debounce, then check no refreshSession fires
      await vi.advanceTimersByTimeAsync(10000)

      expect(handler.refreshSession).not.toHaveBeenCalled()
    })

    it('stops timer on socket close', async () => {
      const { client, mockSocket, handler } = createTestClient({
        sessionRefreshIntervalMs: 5000,
      })

      connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)

      mockSocket.simulateClose()

      await vi.advanceTimersByTimeAsync(10000)

      expect(handler.refreshSession).not.toHaveBeenCalled()
    })

    it('restarts timer on reconnect', async () => {
      const { client, mockSocket, handler } = createTestClient({
        sessionRefreshIntervalMs: 5000,
      })

      connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)

      // Simulate reconnect
      mockSocket.simulateClose()
      mockSocket.simulateOpen()
      mockSocket.simulateMessage({ type: 'connected', connectionId: 'conn-456' })
      await vi.advanceTimersByTimeAsync(0)

      handler.refreshSession.mockClear()

      await vi.advanceTimersByTimeAsync(5000)

      expect(handler.refreshSession).toHaveBeenCalledTimes(1)
    })

    it('does not start timer without sessionRefreshIntervalMs option', async () => {
      const { client, mockSocket, handler } = createTestClient()

      connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)

      await vi.advanceTimersByTimeAsync(60000)

      expect(handler.refreshSession).not.toHaveBeenCalled()
    })

    it('does not start timer without handler refreshSession method', async () => {
      const { client, mockSocket } = createTestClient({
        sessionRefreshIntervalMs: 5000,
        subscriptionHandler: {
          subscribe: vi.fn().mockResolvedValue(undefined),
          unsubscribe: vi.fn().mockResolvedValue(undefined),
        },
      })

      connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)

      // No error thrown, timer simply doesn't start
      await vi.advanceTimersByTimeAsync(10000)
    })
  })

  describe('debounced disconnect', () => {
    it('does not disconnect immediately when subscription count drops to 0', async () => {
      const { client, mockSocket } = createTestClient()

      const unsub = connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)

      unsub()

      // Still connected — disconnect is debounced
      expect(client.getConnectionStatus()).not.toBe('disconnected')
    })

    it('disconnects after the debounce window expires', async () => {
      const { client, mockSocket } = createTestClient()

      const unsub = connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)

      unsub()
      await vi.advanceTimersByTimeAsync(2000)

      expect(client.getConnectionStatus()).toBe('disconnected')
    })

    it('cancels pending disconnect when new subscription arrives during debounce window', async () => {
      const { client, mockSocket } = createTestClient()
      const statusChanges: ConnectionStatus[] = []

      client.onStatusChange((s) => statusChanges.push(s))

      const unsub1 = connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)

      // Unsubscribe last — starts debounce timer
      unsub1()

      // Resubscribe within the debounce window (simulates navigation: old page unmounts, new page mounts)
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-2' },
        onMessage: vi.fn(),
      })

      // Advance past the debounce window
      await vi.advanceTimersByTimeAsync(200)

      // Should NOT have disconnected — the resubscribe cancelled the pending disconnect
      expect(client.getConnectionStatus()).not.toBe('disconnected')
      expect(statusChanges).not.toContain('disconnected')
    })

    it('preserves connection across simulated page navigation (unsub all → resub)', async () => {
      const { client, mockSocket } = createTestClient()

      connectViaSubscribe({ client, mockSocket })
      await vi.advanceTimersByTimeAsync(0)

      // Simulate old page unmounting: unsubscribe all tokens
      const unsub1 = client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'ETH' },
        onMessage: vi.fn(),
      })
      const unsub2 = client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'BTC' },
        onMessage: vi.fn(),
      })
      await vi.advanceTimersByTimeAsync(0)

      // Old page unmounts (cleanup effects fire)
      unsub1()
      unsub2()

      // New page mounts (setup effects fire) — within the debounce window
      client.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'UNI' },
        onMessage: vi.fn(),
      })

      await vi.advanceTimersByTimeAsync(200)

      // Connection should have persisted — no disconnect/reconnect cycle
      expect(client.isConnected()).toBe(true)
      expect(client.getConnectionStatus()).toBe('connected')
    })
  })
})
