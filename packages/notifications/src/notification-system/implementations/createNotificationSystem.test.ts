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
    triggerNotifications: (notifications: InAppNotification[]) => void
  } {
    let callback: ((notifications: InAppNotification[]) => void) | undefined

    return {
      dataSource: {
        start: (onNotifications): void => {
          callback = onNotifications
        },
        stop: vi.fn().mockResolvedValue(undefined),
      },
      triggerNotifications: (notifications): void => {
        if (callback) {
          callback(notifications)
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
        if (filterFn) {
          return Promise.resolve(filterFn(notifications))
        }
        // Default: return all notifications
        return Promise.resolve(notifications)
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
      expect(typeof system.onDismiss).toBe('function')
      expect(typeof system.onButtonClick).toBe('function')
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
    it('tracks dismissed notification with dismiss strategy', async () => {
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
      await system.onDismiss('id-1')

      const trackedCalls = getTrackedCalls()
      expect(trackedCalls).toHaveLength(1)
      expect(trackedCalls[0].id).toBe('id-1')
      expect(trackedCalls[0].metadata.strategy).toBe('dismiss')
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

      await system.onDismiss('id-1')

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
      await system.onDismiss('non-existent-id')

      // Should not throw and should still track
      expect(tracker.track).toHaveBeenCalled()
      expect(getCleanupCallCount()).toBe(0)
    })

    it('adds dismissed notification to processed IDs', async () => {
      const { dataSource, triggerNotifications } = createMockDataSource()
      const { tracker } = createMockTracker()
      // Create processor that filters based on tracker's processed IDs
      const processor: NotificationProcessor = {
        process: vi.fn(async (notifications: InAppNotification[]) => {
          const processedIds = await tracker.getProcessedIds()
          return notifications.filter((n) => !processedIds.has(n.id))
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

      // Dismiss it
      await system.onDismiss('id-1')

      // Try to render it again - should not render
      const renderedCountBefore = getRenderedNotifications().length
      triggerNotifications([notification])
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(getRenderedNotifications().length).toBe(renderedCountBefore)
    })
  })

  describe('onButtonClick', () => {
    it('handles button click without throwing', () => {
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

      expect(() => system.onButtonClick('id-1', 'primary-button')).not.toThrow()
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

    it('handles processor returning empty array', async () => {
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
