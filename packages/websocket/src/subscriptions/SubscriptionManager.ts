import type {
  SubscribeInput,
  SubscriptionEntry,
  SubscriptionManagerOptions,
} from '@universe/websocket/src/subscriptions/types'

/**
 * Manages subscription lifecycle with reference counting and microtask batching.
 *
 * Key features:
 * - Reference counting: Only calls REST subscribe on first subscriber, unsubscribe on last
 * - Microtask batching: Coalesces subscribe/unsubscribe calls within the same microtask
 * - Eager cancellation: subscribe cancels a pending unsubscribe for the same key (and vice versa),
 *   so navigations that unmount and remount the same subscription produce zero API calls
 * - Auto-resubscribe: On reconnect, resubscribes all active subscriptions with new connectionId
 * - Deduplication: Multiple subscribers to same params share one subscription
 * - Message routing: Routes incoming messages to appropriate callbacks
 */
export class SubscriptionManager<TParams, TMessage> {
  private subscriptions = new Map<string, SubscriptionEntry<TParams, TMessage>>()
  private readonly handler: SubscriptionManagerOptions<TParams>['handler']
  private readonly createKey: SubscriptionManagerOptions<TParams>['createKey']
  private readonly onError?: SubscriptionManagerOptions<TParams>['onError']
  private readonly onSubscriptionCountChange?: SubscriptionManagerOptions<TParams>['onSubscriptionCountChange']
  private connectionId: string | null = null

  private pendingSubscribes = new Map<string, TParams>()
  private pendingUnsubscribes = new Map<string, TParams>()
  private subscribeFlushScheduled = false
  private unsubscribeFlushScheduled = false

  constructor(options: SubscriptionManagerOptions<TParams>) {
    this.handler = options.handler
    this.createKey = options.createKey
    this.onError = options.onError
    this.onSubscriptionCountChange = options.onSubscriptionCountChange
  }

  /**
   * Set the current connection ID. Called when connection is established.
   */
  setConnectionId(connectionId: string | null): void {
    this.connectionId = connectionId
  }

  /**
   * Get the current connection ID.
   */
  getConnectionId(): string | null {
    return this.connectionId
  }

  /**
   * Subscribe to a channel with given params.
   * Synchronous — returns an unsubscribe function immediately.
   * The actual REST subscribe call is batched via queueMicrotask.
   */
  subscribe(input: SubscribeInput<TParams, TMessage>): () => void {
    const { channel, params, callback } = input
    const key = this.createKey(channel, params)
    let entry = this.subscriptions.get(key)
    let isNewEntry = false

    if (entry) {
      entry.subscriberCount++
      if (callback) {
        entry.callbacks.add(callback)
      }
    } else {
      isNewEntry = true
      entry = {
        channel,
        params,
        callbacks: new Set(callback ? [callback] : []),
        subscriberCount: 1,
      }
      this.subscriptions.set(key, entry)

      if (this.pendingUnsubscribes.has(key)) {
        // Re-subscribing to a key that was just unsubscribed in this microtask window.
        // Cancel the pending unsubscribe — the server still has this subscription.
        this.pendingUnsubscribes.delete(key)
      } else {
        // Genuinely new subscription — queue the REST subscribe call
        this.pendingSubscribes.set(key, params)
        this.scheduleSubscribeFlush()
      }
    }

    if (isNewEntry) {
      this.onSubscriptionCountChange?.(this.subscriptions.size)
    }

    let unsubscribed = false
    return () => {
      if (unsubscribed) {
        return
      }
      unsubscribed = true
      this.handleUnsubscribe(key, callback)
    }
  }

  private handleUnsubscribe(key: string, callback: ((message: TMessage) => void) | undefined): void {
    const entry = this.subscriptions.get(key)
    if (!entry) {
      return
    }

    if (callback) {
      entry.callbacks.delete(callback)
    }

    entry.subscriberCount--

    // If no more subscribers, remove subscription entirely
    if (entry.subscriberCount === 0) {
      this.subscriptions.delete(key)

      if (this.pendingSubscribes.has(key)) {
        // Unsubscribing a key that was just subscribed in this microtask window.
        // Cancel the pending subscribe — no need to tell the server about either.
        this.pendingSubscribes.delete(key)
      } else {
        // Queue the REST unsubscribe call
        this.pendingUnsubscribes.set(key, entry.params)
        this.scheduleUnsubscribeFlush()
      }

      this.onSubscriptionCountChange?.(this.subscriptions.size)
    }
  }

  private scheduleSubscribeFlush(): void {
    if (!this.subscribeFlushScheduled) {
      this.subscribeFlushScheduled = true
      queueMicrotask(() => {
        const params = [...this.pendingSubscribes.values()]
        this.pendingSubscribes.clear()
        this.subscribeFlushScheduled = false
        if (params.length > 0 && this.connectionId) {
          this.executeBatchSubscribe(params)
        }
      })
    }
  }

  private scheduleUnsubscribeFlush(): void {
    if (!this.unsubscribeFlushScheduled) {
      this.unsubscribeFlushScheduled = true
      queueMicrotask(() => {
        const params = [...this.pendingUnsubscribes.values()]
        this.pendingUnsubscribes.clear()
        this.unsubscribeFlushScheduled = false
        if (params.length > 0 && this.connectionId) {
          this.executeBatchUnsubscribe(params)
        }
      })
    }
  }

  private executeBatchSubscribe(params: TParams[]): void {
    const { connectionId } = this
    if (!connectionId) {
      return
    }
    if (this.handler.subscribeBatch) {
      this.handler.subscribeBatch(connectionId, params).catch((error) => {
        this.onError?.(error, 'subscribe')
      })
    } else {
      Promise.all(params.map((p) => this.handler.subscribe(connectionId, p))).catch((error) => {
        this.onError?.(error, 'subscribe')
      })
    }
  }

  private executeBatchUnsubscribe(params: TParams[]): void {
    const { connectionId } = this
    if (!connectionId) {
      return
    }
    if (this.handler.unsubscribeBatch) {
      this.handler.unsubscribeBatch(connectionId, params).catch((error) => {
        this.onError?.(error, 'unsubscribe')
      })
    } else {
      Promise.all(params.map((p) => this.handler.unsubscribe(connectionId, p))).catch((error) => {
        this.onError?.(error, 'unsubscribe')
      })
    }
  }

  /**
   * Resubscribe all active subscriptions with a new connection ID.
   * Called after reconnection. Uses subscribeBatch when available.
   */
  async resubscribeAll(connectionId: string): Promise<void> {
    this.connectionId = connectionId

    const allParams = Array.from(this.subscriptions.values()).map((entry) => entry.params)
    if (allParams.length === 0) {
      return
    }

    if (this.handler.subscribeBatch) {
      try {
        await this.handler.subscribeBatch(connectionId, allParams)
      } catch (error) {
        this.onError?.(error, 'resubscribe')
      }
    } else {
      const subscribePromises = allParams.map((params) =>
        this.handler.subscribe(connectionId, params).catch((error) => {
          this.onError?.(error, 'resubscribe')
        }),
      )
      await Promise.all(subscribePromises)
    }
  }

  /**
   * Dispatch an incoming message to appropriate callbacks.
   */
  dispatch(key: string, message: TMessage): void {
    const entry = this.subscriptions.get(key)
    if (!entry) {
      return
    }

    for (const callback of entry.callbacks) {
      try {
        callback(message)
      } catch (error) {
        this.onError?.(error, 'dispatch')
      }
    }
  }

  /**
   * Get all active subscriptions.
   */
  getActiveSubscriptions(): Array<{ channel: string; params: TParams; subscriberCount: number }> {
    return Array.from(this.subscriptions.entries()).map(([, entry]) => ({
      channel: entry.channel,
      params: entry.params,
      subscriberCount: entry.subscriberCount,
    }))
  }

  /**
   * Check if there are any active subscriptions.
   */
  hasActiveSubscriptions(): boolean {
    return this.subscriptions.size > 0
  }

  /**
   * Clear all subscriptions without calling unsubscribe API.
   * Used on disconnect.
   */
  clear(): void {
    this.subscriptions.clear()
    this.pendingSubscribes.clear()
    this.pendingUnsubscribes.clear()
    this.connectionId = null
  }

  /**
   * Refresh the session if the handler supports it.
   */
  async refreshSession(): Promise<void> {
    if (!this.connectionId || !this.handler.refreshSession) {
      return
    }

    try {
      await this.handler.refreshSession(this.connectionId)
    } catch (error) {
      this.onError?.(error, 'refreshSession')
    }
  }
}
