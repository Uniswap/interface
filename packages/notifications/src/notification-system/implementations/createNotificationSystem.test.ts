import type { InAppNotification } from '@universe/api'
import type { NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import type { NotificationProcessor } from '@universe/notifications/src/notification-processor/NotificationProcessor'
import type { NotificationRenderer } from '@universe/notifications/src/notification-renderer/NotificationRenderer'
import { createNotificationSystem } from '@universe/notifications/src/notification-system/implementations/createNotificationSystem'
import type {
  NotificationTracker,
  TrackingMetadata,
} from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { describe, expect, it, vi } from 'vitest'

describe('createNotificationSystem', () => {
  const createMockNotification = (params: { name: string; timestamp: number; id?: string }): InAppNotification =>
    ({
      id: params.id ?? `${params.name}-id`,
      notificationName: params.name,
      timestamp: params.timestamp,
      content: { style: 'CONTENT_STYLE_MODAL', title: `${params.name}-title` },
      metaData: {},
      userId: 'user-1',
    }) as InAppNotification

  function createMockDataSource(): {
    dataSource: NotificationDataSource
    triggerNotifications: (notifications: InAppNotification[], source?: string) => void
  } {
    let callback: ((notifications: InAppNotification[], source: string) => void) | undefined

    return {
      dataSource: {
        start: (onNotifications): void => {
          callback = onNotifications
        },
        stop: vi.fn().mockResolvedValue(undefined),
      },
      triggerNotifications: (notifications, source = 'test_source'): void => {
        if (callback) {
          callback(notifications, source)
        }
      },
    }
  }

  function createMockTracker(initialProcessedIds: Set<string> = new Set()): {
    tracker: NotificationTracker
    getTrackedCalls: () => Array<{ id: string; metadata: TrackingMetadata }>
  } {
    const trackedCalls: Array<{ id: string; metadata: TrackingMetadata }> = []

    return {
      tracker: {
        isProcessed: vi.fn((id: string) => Promise.resolve(initialProcessedIds.has(id))),
        getProcessedIds: vi.fn(() => Promise.resolve(new Set(initialProcessedIds))),
        track: vi.fn((id: string, metadata: TrackingMetadata) => {
          trackedCalls.push({ id, metadata })
          initialProcessedIds.add(id)
          return Promise.resolve()
        }),
      },
      getTrackedCalls: () => trackedCalls,
    }
  }

  function createMockProcessor(
    filterFn?: (notifications: InAppNotification[]) => InAppNotification[],
  ): NotificationProcessor {
    return {
      process: vi.fn((notifications: InAppNotification[]) => {
        const filteredNotifications = filterFn ? filterFn(notifications) : notifications
        // Return NotificationProcessorResult with primary and chained
        return Promise.resolve({
          primary: filteredNotifications,
          chained: new Map(),
        })
      }),
    }
  }

  function createMockRenderer(canRenderAll = true): {
    renderer: NotificationRenderer
    getRenderedNotifications: () => InAppNotification[]
    getCleanupCallCount: () => number
  } {
    const rendered: InAppNotification[] = []
    let cleanupCallCount = 0

    return {
      renderer: {
        render: vi.fn((notification: InAppNotification) => {
          rendered.push(notification)
          return () => {
            cleanupCallCount++
          }
        }),
        canRender: vi.fn(() => canRenderAll),
      },
      getRenderedNotifications: () => rendered,
      getCleanupCallCount: () => cleanupCallCount,
    }
  }

  describe('initialization', () => {
    it('creates a notification system with required methods', () => {
      const { dataSource } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      expect(system).toBeDefined()
      expect(typeof system.initialize).toBe('function')
      expect(typeof system.onNotificationClick).toBe('function')
      expect(typeof system.onRenderFailed).toBe('function')
      expect(typeof system.destroy).toBe('function')
    })

    it('starts all data sources during initialization', async () => {
      const { dataSource: dataSource1 } = createMockDataSource()
      const { dataSource: dataSource2 } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer } = createMockRenderer()

      const startSpy1 = vi.spyOn(dataSource1, 'start')
      const startSpy2 = vi.spyOn(dataSource2, 'start')

      const system = createNotificationSystem({
        dataSources: [dataSource1, dataSource2],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      expect(startSpy1).toHaveBeenCalledOnce()
      expect(startSpy2).toHaveBeenCalledOnce()
    })
  })

  describe('notification handling', () => {
    it('processes and renders new notifications', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer, getRenderedNotifications } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      const notifications = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, id: 'id-2' }),
      ]

      triggerNotifications(notifications)

      // Wait for async handling
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(processor.process).toHaveBeenCalledWith(notifications)
      expect(getRenderedNotifications()).toHaveLength(2)
    })

    it('filters out already-processed notifications', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker(new Set(['id-1']))
      // Create processor that filters out id-1
      const processor = createMockProcessor((notifications) => notifications.filter((n) => n.id !== 'id-1'))
      const { renderer, getRenderedNotifications } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      const notifications = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, id: 'id-2' }),
      ]

      triggerNotifications(notifications)

      // Wait for async handling
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Only notif-2 should be rendered (notif-1 was already processed)
      expect(getRenderedNotifications()).toHaveLength(1)
      expect(getRenderedNotifications()[0].id).toBe('id-2')
    })

    it('does not render notifications that cannot be rendered', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer, getRenderedNotifications } = createMockRenderer(false)

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      const notifications = [createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' })]

      triggerNotifications(notifications)

      // Wait for async handling
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(renderer.canRender).toHaveBeenCalled()
      expect(getRenderedNotifications()).toHaveLength(0)
    })

    it('does not render the same notification twice', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer, getRenderedNotifications } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      const notifications = [createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' })]

      // Trigger same notification twice
      triggerNotifications(notifications)
      await new Promise((resolve) => setTimeout(resolve, 10))

      triggerNotifications(notifications)
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Should only be rendered once
      expect(getRenderedNotifications()).toHaveLength(1)
    })

    it('handles notifications from multiple data sources', async () => {
      const { dataSource: dataSource1, triggerNotifications: trigger1 } = createMockDataSource()
      const { dataSource: dataSource2, triggerNotifications: trigger2 } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer, getRenderedNotifications } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource1, dataSource2],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      trigger1([createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' })])
      await new Promise((resolve) => setTimeout(resolve, 10))

      trigger2([createMockNotification({ name: 'notif-2', timestamp: 2000, id: 'id-2' })])
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(getRenderedNotifications()).toHaveLength(2)
    })
  })

  describe('onDismiss', () => {
    it('does not track when notification is dismissed (only ACK tracks)', async () => {
      const { dataSource } = createMockDataSource()
      const { tracker, getTrackedCalls } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()
      system.onNotificationClick('id-1', { type: 'dismiss' })
      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      const trackedCalls = getTrackedCalls()
      expect(trackedCalls).toHaveLength(0) // Dismiss should NOT track
    })

    it('calls cleanup function for rendered notification', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer, getCleanupCallCount } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      const notifications = [createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' })]

      triggerNotifications(notifications)
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(getCleanupCallCount()).toBe(0)

      system.onNotificationClick('id-1', { type: 'dismiss' })
      // Wait for async cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(getCleanupCallCount()).toBe(1)
    })

    it('handles dismiss for non-rendered notification gracefully', async () => {
      const { dataSource } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer, getCleanupCallCount } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      // Dismiss notification that was never rendered
      system.onNotificationClick('non-existent-id', { type: 'dismiss' })
      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Should not throw and should NOT track (dismiss doesn't track)
      expect(tracker.track).not.toHaveBeenCalled()
      expect(getCleanupCallCount()).toBe(0)
    })

    it('dismissed notifications can be re-rendered (only ACK prevents re-render)', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker()
      // Create processor that filters based on tracker's processed IDs
      const processor: NotificationProcessor = {
        process: vi.fn(async (notifications: InAppNotification[]) => {
          const processedIds = await tracker.getProcessedIds()
          const filtered = notifications.filter((n) => !processedIds.has(n.id))
          return {
            primary: filtered,
            chained: new Map(),
          }
        }),
      }
      const { renderer, getRenderedNotifications } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      const notification = createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' })

      // Render notification
      triggerNotifications([notification])
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(getRenderedNotifications().length).toBe(1)

      // Dismiss it (dismiss doesn't track)
      system.onNotificationClick('id-1', { type: 'dismiss' })
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Try to render it again - SHOULD render because dismiss doesn't track
      triggerNotifications([notification])
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(getRenderedNotifications().length).toBe(2) // Rendered twice!
    })
  })

  describe('onRenderFailed', () => {
    it('cleans up the failed render without tracking', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker, getTrackedCalls } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer, getCleanupCallCount } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      const notification = createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' })
      triggerNotifications([notification])
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Call onRenderFailed instead of onDismiss
      system.onRenderFailed('id-1')

      // Should call cleanup but NOT track
      expect(getCleanupCallCount()).toBe(1)
      expect(getTrackedCalls()).toHaveLength(0)
    })

    it('allows notification to be re-rendered after failed render', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker()
      // Processor that filters based on tracker's processed IDs
      const processor: NotificationProcessor = {
        process: vi.fn(async (notifications: InAppNotification[]) => {
          const processedIds = await tracker.getProcessedIds()
          const filtered = notifications.filter((n) => !processedIds.has(n.id))
          return {
            primary: filtered,
            chained: new Map(),
          }
        }),
      }
      const { renderer, getRenderedNotifications } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      const notification = createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' })

      // First render
      triggerNotifications([notification])
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(getRenderedNotifications()).toHaveLength(1)

      // Mark as failed render
      system.onRenderFailed('id-1')

      // Should be able to render again (not in processedIds)
      triggerNotifications([notification])
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Should be rendered twice total (once initially, once after failed render cleanup)
      expect(getRenderedNotifications()).toHaveLength(2)
    })

    it('handles onRenderFailed for non-rendered notification gracefully', () => {
      const { dataSource } = createMockDataSource()
      const { tracker, getTrackedCalls } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer, getCleanupCallCount } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      // Call onRenderFailed for notification that was never rendered
      expect(() => system.onRenderFailed('non-existent-id')).not.toThrow()

      // Should not track or call cleanup
      expect(getTrackedCalls()).toHaveLength(0)
      expect(getCleanupCallCount()).toBe(0)
    })
  })

  describe('onNotificationClick', () => {
    it('handles notification click without throwing', () => {
      const { dataSource } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      expect(() => system.onNotificationClick('id-1', { type: 'button', index: 0 })).not.toThrow()
    })
  })

  describe('destroy', () => {
    it('stops all data sources', async () => {
      const { dataSource: dataSource1 } = createMockDataSource()
      const { dataSource: dataSource2 } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource1, dataSource2],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()
      system.destroy()

      expect(dataSource1.stop).toHaveBeenCalledOnce()
      expect(dataSource2.stop).toHaveBeenCalledOnce()
    })

    it('calls cleanup for all active renders', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer, getCleanupCallCount } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      const notifications = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, id: 'id-2' }),
        createMockNotification({ name: 'notif-3', timestamp: 3000, id: 'id-3' }),
      ]

      triggerNotifications(notifications)
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(getCleanupCallCount()).toBe(0)

      system.destroy()

      expect(getCleanupCallCount()).toBe(3)
    })

    it('can be called before initialization without error', () => {
      const { dataSource } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      expect(() => system.destroy()).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('handles empty notification arrays', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer, getRenderedNotifications } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      triggerNotifications([])
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(getRenderedNotifications()).toHaveLength(0)
    })

    it('handles processor returning empty primary array', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker()
      const processor = createMockProcessor(() => []) // Always return empty
      const { renderer, getRenderedNotifications } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [dataSource],
        tracker,
        processor,
        renderer,
      })

      await system.initialize()

      const notifications = [createMockNotification({ name: 'notif-1', timestamp: 1000, id: 'id-1' })]

      triggerNotifications(notifications)
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(getRenderedNotifications()).toHaveLength(0)
    })

    it('handles system with no data sources', async () => {
      const { tracker } = createMockTracker()
      const processor = createMockProcessor()
      const { renderer } = createMockRenderer()

      const system = createNotificationSystem({
        dataSources: [],
        tracker,
        processor,
        renderer,
      })

      await expect(system.initialize()).resolves.not.toThrow()
      expect(() => system.destroy()).not.toThrow()
    })
  })
})
