import { SubscriptionManager } from '@universe/websocket/src/subscriptions/SubscriptionManager'
import { describe, expect, it, vi } from 'vitest'

interface TestParams {
  channel: string
  id: string
}

interface TestMessage {
  data: string
}

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function createTestManager(
  overrides?: Partial<{
    subscribe: (connectionId: string, params: TestParams) => Promise<void>
    unsubscribe: (connectionId: string, params: TestParams) => Promise<void>
    subscribeBatch: (connectionId: string, params: TestParams[]) => Promise<void>
    unsubscribeBatch: (connectionId: string, params: TestParams[]) => Promise<void>
    refreshSession: (connectionId: string) => Promise<void>
    onSubscriptionCountChange: (count: number) => void
  }>,
): {
  manager: SubscriptionManager<TestParams, TestMessage>
  handler: {
    subscribe: ReturnType<typeof vi.fn>
    unsubscribe: ReturnType<typeof vi.fn>
    subscribeBatch: ReturnType<typeof vi.fn>
    unsubscribeBatch: ReturnType<typeof vi.fn>
    refreshSession: ReturnType<typeof vi.fn>
  }
} {
  const handler = {
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    subscribeBatch: vi.fn().mockResolvedValue(undefined),
    unsubscribeBatch: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  const manager = new SubscriptionManager<TestParams, TestMessage>({
    handler,
    createKey: (channel, params): string => `${channel}:${params.id}`,
    onSubscriptionCountChange: overrides?.onSubscriptionCountChange,
  })

  return { manager, handler }
}

describe('SubscriptionManager', () => {
  describe('subscribe', () => {
    it('calls handler via subscribeBatch on first subscriber after microtask flush', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-123')

      const callback = vi.fn()
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback })

      // Not called yet — batched
      expect(handler.subscribeBatch).not.toHaveBeenCalled()
      expect(handler.subscribe).not.toHaveBeenCalled()

      await flushMicrotasks()

      expect(handler.subscribeBatch).toHaveBeenCalledWith('conn-123', [{ channel: 'prices', id: 'token-1' }])
      expect(handler.subscribeBatch).toHaveBeenCalledTimes(1)
    })

    it('falls back to individual subscribe when subscribeBatch is not provided', async () => {
      const handler = {
        subscribe: vi.fn().mockResolvedValue(undefined),
        unsubscribe: vi.fn().mockResolvedValue(undefined),
        refreshSession: vi.fn().mockResolvedValue(undefined),
      }
      const manager = new SubscriptionManager<TestParams, TestMessage>({
        handler,
        createKey: (channel, params): string => `${channel}:${params.id}`,
      })
      manager.setConnectionId('conn-123')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })

      await flushMicrotasks()

      expect(handler.subscribe).toHaveBeenCalledWith('conn-123', { channel: 'prices', id: 'token-1' })
      expect(handler.subscribe).toHaveBeenCalledTimes(1)
    })

    it('batches multiple subscribes in same microtask into one subscribeBatch call', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-123')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-2' }, callback: vi.fn() })
      manager.subscribe({ channel: 'events', params: { channel: 'events', id: 'event-1' }, callback: vi.fn() })

      await flushMicrotasks()

      expect(handler.subscribeBatch).toHaveBeenCalledTimes(1)
      expect(handler.subscribeBatch).toHaveBeenCalledWith('conn-123', [
        { channel: 'prices', id: 'token-1' },
        { channel: 'prices', id: 'token-2' },
        { channel: 'events', id: 'event-1' },
      ])
    })

    it('does not call handler.subscribe for subsequent subscribers to same key', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-123')

      const callback1 = vi.fn()
      const callback2 = vi.fn()

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: callback1 })
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: callback2 })

      await flushMicrotasks()

      expect(handler.subscribeBatch).toHaveBeenCalledTimes(1)
      expect(handler.subscribeBatch).toHaveBeenCalledWith('conn-123', [{ channel: 'prices', id: 'token-1' }])
    })

    it('does not call handler when not connected', async () => {
      const { manager, handler } = createTestManager()
      // No connectionId set

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })

      await flushMicrotasks()

      expect(handler.subscribeBatch).not.toHaveBeenCalled()
      expect(handler.subscribe).not.toHaveBeenCalled()
    })

    it('returns synchronous unsubscribe function', () => {
      const { manager } = createTestManager()
      manager.setConnectionId('conn-123')

      const unsubscribe = manager.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        callback: vi.fn(),
      })

      expect(typeof unsubscribe).toBe('function')
    })

    it('works without a callback (optional onMessage)', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-123')

      const unsubscribe = manager.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
      })

      await flushMicrotasks()

      expect(handler.subscribeBatch).toHaveBeenCalledTimes(1)
      expect(typeof unsubscribe).toBe('function')
    })
  })

  describe('unsubscribe', () => {
    it('calls handler.unsubscribeBatch when last subscriber leaves', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-123')

      const callback = vi.fn()
      const unsubscribe = manager.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        callback,
      })

      await flushMicrotasks()

      unsubscribe()

      await flushMicrotasks()

      expect(handler.unsubscribeBatch).toHaveBeenCalledWith('conn-123', [{ channel: 'prices', id: 'token-1' }])
    })

    it('does not call handler.unsubscribe when other subscribers remain', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-123')

      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const unsubscribe1 = manager.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        callback: callback1,
      })
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: callback2 })

      await flushMicrotasks()

      unsubscribe1()

      await flushMicrotasks()

      expect(handler.unsubscribeBatch).not.toHaveBeenCalled()
      expect(handler.unsubscribe).not.toHaveBeenCalled()
    })

    it('batches multiple unsubscribes in same microtask', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-123')

      const unsub1 = manager.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        callback: vi.fn(),
      })
      const unsub2 = manager.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-2' },
        callback: vi.fn(),
      })

      await flushMicrotasks()

      unsub1()
      unsub2()

      await flushMicrotasks()

      expect(handler.unsubscribeBatch).toHaveBeenCalledTimes(1)
      expect(handler.unsubscribeBatch).toHaveBeenCalledWith('conn-123', [
        { channel: 'prices', id: 'token-1' },
        { channel: 'prices', id: 'token-2' },
      ])
    })

    it('subscribe + immediate unsubscribe in same microtask produces net-zero API calls', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-123')

      const unsub = manager.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        callback: vi.fn(),
      })
      unsub()

      await flushMicrotasks()

      // Both pending subscribe and unsubscribe should cancel out
      expect(handler.subscribeBatch).not.toHaveBeenCalled()
      expect(handler.subscribe).not.toHaveBeenCalled()
      expect(handler.unsubscribeBatch).not.toHaveBeenCalled()
      expect(handler.unsubscribe).not.toHaveBeenCalled()
    })
  })

  describe('dispatch', () => {
    it('routes messages to correct callbacks', () => {
      const { manager } = createTestManager()
      manager.setConnectionId('conn-123')

      const callback1 = vi.fn()
      const callback2 = vi.fn()

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: callback1 })
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-2' }, callback: callback2 })

      manager.dispatch('prices:token-1', { data: 'price-update-1' })

      expect(callback1).toHaveBeenCalledWith({ data: 'price-update-1' })
      expect(callback2).not.toHaveBeenCalled()
    })

    it('calls all callbacks for same subscription', () => {
      const { manager } = createTestManager()
      manager.setConnectionId('conn-123')

      const callback1 = vi.fn()
      const callback2 = vi.fn()

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: callback1 })
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: callback2 })

      manager.dispatch('prices:token-1', { data: 'price-update' })

      expect(callback1).toHaveBeenCalledWith({ data: 'price-update' })
      expect(callback2).toHaveBeenCalledWith({ data: 'price-update' })
    })

    it('ignores messages for unknown subscriptions', () => {
      const { manager } = createTestManager()

      // Should not throw
      manager.dispatch('unknown:key', { data: 'unknown' })
    })
  })

  describe('resubscribeAll', () => {
    it('resubscribes all active subscriptions with new connectionId using subscribeBatch', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-old')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-2' }, callback: vi.fn() })

      await flushMicrotasks()
      handler.subscribeBatch.mockClear()

      await manager.resubscribeAll('conn-new')

      expect(handler.subscribeBatch).toHaveBeenCalledTimes(1)
      expect(handler.subscribeBatch).toHaveBeenCalledWith('conn-new', [
        { channel: 'prices', id: 'token-1' },
        { channel: 'prices', id: 'token-2' },
      ])
    })

    it('falls back to individual subscribe calls when subscribeBatch is not provided', async () => {
      const handler = {
        subscribe: vi.fn().mockResolvedValue(undefined),
        unsubscribe: vi.fn().mockResolvedValue(undefined),
        refreshSession: vi.fn().mockResolvedValue(undefined),
      }
      const manager = new SubscriptionManager<TestParams, TestMessage>({
        handler,
        createKey: (channel, params): string => `${channel}:${params.id}`,
      })
      manager.setConnectionId('conn-old')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-2' }, callback: vi.fn() })

      await flushMicrotasks()
      handler.subscribe.mockClear()

      await manager.resubscribeAll('conn-new')

      expect(handler.subscribe).toHaveBeenCalledTimes(2)
      expect(handler.subscribe).toHaveBeenCalledWith('conn-new', { channel: 'prices', id: 'token-1' })
      expect(handler.subscribe).toHaveBeenCalledWith('conn-new', { channel: 'prices', id: 'token-2' })
    })

    it('updates internal connectionId', async () => {
      const { manager } = createTestManager()
      manager.setConnectionId('conn-old')

      await manager.resubscribeAll('conn-new')

      expect(manager.getConnectionId()).toBe('conn-new')
    })
  })

  describe('onSubscriptionCountChange', () => {
    it('fires when first subscription is added', () => {
      const onSubscriptionCountChange = vi.fn()
      const { manager } = createTestManager({ onSubscriptionCountChange })
      manager.setConnectionId('conn-123')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })

      expect(onSubscriptionCountChange).toHaveBeenCalledWith(1)
    })

    it('fires when subscription count increases', () => {
      const onSubscriptionCountChange = vi.fn()
      const { manager } = createTestManager({ onSubscriptionCountChange })
      manager.setConnectionId('conn-123')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-2' }, callback: vi.fn() })

      expect(onSubscriptionCountChange).toHaveBeenCalledTimes(2)
      expect(onSubscriptionCountChange).toHaveBeenNthCalledWith(1, 1)
      expect(onSubscriptionCountChange).toHaveBeenNthCalledWith(2, 2)
    })

    it('fires when last subscription is removed', async () => {
      const onSubscriptionCountChange = vi.fn()
      const { manager } = createTestManager({ onSubscriptionCountChange })
      manager.setConnectionId('conn-123')

      const unsub = manager.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        callback: vi.fn(),
      })

      onSubscriptionCountChange.mockClear()
      unsub()

      expect(onSubscriptionCountChange).toHaveBeenCalledWith(0)
    })

    it('does not fire for additional subscribers to same key', () => {
      const onSubscriptionCountChange = vi.fn()
      const { manager } = createTestManager({ onSubscriptionCountChange })
      manager.setConnectionId('conn-123')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })

      // Only fired once — second subscriber to same key doesn't change unique subscription count
      expect(onSubscriptionCountChange).toHaveBeenCalledTimes(1)
      expect(onSubscriptionCountChange).toHaveBeenCalledWith(1)
    })
  })

  describe('getActiveSubscriptions', () => {
    it('returns all active subscriptions with subscriber counts', () => {
      const { manager } = createTestManager()
      manager.setConnectionId('conn-123')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })
      manager.subscribe({ channel: 'events', params: { channel: 'events', id: 'event-1' }, callback: vi.fn() })

      const subscriptions = manager.getActiveSubscriptions()

      expect(subscriptions).toHaveLength(2)
      expect(subscriptions).toContainEqual({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        subscriberCount: 2,
      })
      expect(subscriptions).toContainEqual({
        channel: 'events',
        params: { channel: 'events', id: 'event-1' },
        subscriberCount: 1,
      })
    })
  })

  describe('hasActiveSubscriptions', () => {
    it('returns false when no subscriptions', () => {
      const { manager } = createTestManager()

      expect(manager.hasActiveSubscriptions()).toBe(false)
    })

    it('returns true when subscriptions exist', () => {
      const { manager } = createTestManager()
      manager.setConnectionId('conn-123')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })

      expect(manager.hasActiveSubscriptions()).toBe(true)
    })
  })

  describe('clear', () => {
    it('removes all subscriptions, pending batches, and resets connectionId', () => {
      const { manager } = createTestManager()
      manager.setConnectionId('conn-123')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })

      manager.clear()

      expect(manager.hasActiveSubscriptions()).toBe(false)
      expect(manager.getConnectionId()).toBe(null)
    })

    it('prevents pending subscribes from flushing after clear', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-123')

      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })

      // Clear before microtask flush
      manager.clear()

      await flushMicrotasks()

      // The subscribe batch should not have fired since connectionId was cleared
      expect(handler.subscribeBatch).not.toHaveBeenCalled()
      expect(handler.subscribe).not.toHaveBeenCalled()
    })
  })

  describe('refreshSession', () => {
    it('calls handler.refreshSession when connected', async () => {
      const { manager, handler } = createTestManager()
      manager.setConnectionId('conn-123')

      await manager.refreshSession()

      expect(handler.refreshSession).toHaveBeenCalledWith('conn-123')
    })

    it('does nothing when not connected', async () => {
      const { manager, handler } = createTestManager()

      await manager.refreshSession()

      expect(handler.refreshSession).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('calls onError when subscribeBatch fails (errors are async, not thrown)', async () => {
      const onError = vi.fn()
      const error = new Error('Subscribe failed')

      const manager = new SubscriptionManager<TestParams, TestMessage>({
        handler: {
          subscribe: vi.fn().mockResolvedValue(undefined),
          unsubscribe: vi.fn().mockResolvedValue(undefined),
          subscribeBatch: vi.fn().mockRejectedValue(error),
          unsubscribeBatch: vi.fn().mockResolvedValue(undefined),
        },
        createKey: (channel, params): string => `${channel}:${params.id}`,
        onError,
      })

      manager.setConnectionId('conn-123')
      manager.subscribe({ channel: 'prices', params: { channel: 'prices', id: 'token-1' }, callback: vi.fn() })

      await flushMicrotasks()

      expect(onError).toHaveBeenCalledWith(error, 'subscribe')
    })

    it('calls onError when callback throws during dispatch', () => {
      const onError = vi.fn()
      const error = new Error('Callback error')

      const manager = new SubscriptionManager<TestParams, TestMessage>({
        handler: {
          subscribe: vi.fn().mockResolvedValue(undefined),
          unsubscribe: vi.fn().mockResolvedValue(undefined),
        },
        createKey: (channel, params): string => `${channel}:${params.id}`,
        onError,
      })

      manager.setConnectionId('conn-123')
      manager.subscribe({
        channel: 'prices',
        params: { channel: 'prices', id: 'token-1' },
        callback: (): void => {
          throw error
        },
      })

      manager.dispatch('prices:token-1', { data: 'test' })

      expect(onError).toHaveBeenCalledWith(error, 'dispatch')
    })
  })
})
