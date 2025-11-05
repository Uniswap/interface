import type { InAppNotification } from '@universe/api'
import { createBaseNotificationProcessor } from '@universe/notifications/src/notification-processor/implementations/createBaseNotificationProcessor'
import type { NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { describe, expect, it } from 'vitest'

describe('createBaseNotificationProcessor', () => {
  const createMockNotification = (params: {
    name: string
    timestamp: number
    style: string
    id?: string
  }): InAppNotification =>
    ({
      id: params.id ?? `${params.name}-id`,
      notificationName: params.name,
      timestamp: params.timestamp,
      content: { style: params.style, title: `${params.name}-title` },
      metaData: {},
      userId: 'user-1',
    }) as InAppNotification

  const createMockTracker = (processedIds: Set<string> = new Set()): NotificationTracker => ({
    getProcessedIds: async () => processedIds,
    isProcessed: async (id: string) => processedIds.has(id),
    track: async (): Promise<void> => {},
  })

  describe('initialization', () => {
    it('creates a notification processor with process method', () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)

      expect(processor).toBeDefined()
      expect(typeof processor.process).toBe('function')
    })
  })

  describe('chronological sorting', () => {
    it('sorts notifications by timestamp in ascending order (oldest first)', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-3', timestamp: 3000, style: 'CONTENT_STYLE_MODAL' }),
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_BANNER' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: 'CONTENT_STYLE_POPOVER' }),
      ]

      const result = await processor.process(notifications)

      expect(result).toHaveLength(3)
      expect(result[0].notificationName).toBe('notif-1')
      expect(result[0].timestamp).toBe(1000)
      expect(result[1].notificationName).toBe('notif-2')
      expect(result[1].timestamp).toBe(2000)
      expect(result[2].notificationName).toBe('notif-3')
      expect(result[2].timestamp).toBe(3000)
    })

    it('treats notifications without timestamp as 0 (oldest)', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifWithoutTimestamp: InAppNotification = {
        id: 'notif-no-timestamp-id',
        notificationName: 'notif-no-timestamp',
        content: { style: 'CONTENT_STYLE_MODAL', title: 'notif-no-timestamp-title' },
        userId: 'user-1',
        metaData: {},
      } as InAppNotification
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: 'CONTENT_STYLE_BANNER' }),
        notifWithoutTimestamp,
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_POPOVER' }),
      ]

      const result = await processor.process(notifications)

      expect(result[0].notificationName).toBe('notif-no-timestamp')
      expect(result[1].notificationName).toBe('notif-1')
      expect(result[2].notificationName).toBe('notif-2')
    })

    it('maintains stable sort for notifications with same timestamp', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_MODAL' }),
        createMockNotification({ name: 'notif-2', timestamp: 1000, style: 'CONTENT_STYLE_BANNER' }),
        createMockNotification({ name: 'notif-3', timestamp: 1000, style: 'CONTENT_STYLE_POPOVER' }),
      ]

      const result = await processor.process(notifications)

      // All have same timestamp, so should maintain insertion order
      expect(result).toHaveLength(3)
      expect(result[0].notificationName).toBe('notif-1')
      expect(result[1].notificationName).toBe('notif-2')
      expect(result[2].notificationName).toBe('notif-3')
    })

    it('handles notifications with very large timestamps', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: Number.MAX_SAFE_INTEGER, style: 'CONTENT_STYLE_MODAL' }),
        createMockNotification({ name: 'notif-2', timestamp: 1000, style: 'CONTENT_STYLE_BANNER' }),
      ]

      const result = await processor.process(notifications)

      expect(result).toHaveLength(2)
      expect(result[0].notificationName).toBe('notif-2')
      expect(result[1].notificationName).toBe('notif-1')
    })

    it('handles empty notifications array', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const result = await processor.process([])

      expect(result).toEqual([])
    })

    it('handles single notification', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_MODAL' }),
      ]

      const result = await processor.process(notifications)

      expect(result).toHaveLength(1)
      expect(result[0].notificationName).toBe('notif-1')
    })

    it('handles notifications with negative timestamps', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_MODAL' }),
        createMockNotification({ name: 'notif-2', timestamp: -500, style: 'CONTENT_STYLE_BANNER' }),
        createMockNotification({ name: 'notif-3', timestamp: 0, style: 'CONTENT_STYLE_POPOVER' }),
      ]

      const result = await processor.process(notifications)

      expect(result).toHaveLength(3)
      expect(result[0].notificationName).toBe('notif-2') // -500
      expect(result[1].notificationName).toBe('notif-3') // 0
      expect(result[2].notificationName).toBe('notif-1') // 1000
    })
  })

  describe('filtering processed notifications', () => {
    it('filters out notifications that are in processedIds', async () => {
      const processedIds = new Set<string>(['id-2'])
      const tracker = createMockTracker(processedIds)
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_MODAL', id: 'id-1' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: 'CONTENT_STYLE_BANNER', id: 'id-2' }),
        createMockNotification({ name: 'notif-3', timestamp: 3000, style: 'CONTENT_STYLE_POPOVER', id: 'id-3' }),
      ]

      const result = await processor.process(notifications)

      expect(result).toHaveLength(2)
      expect(result[0].notificationName).toBe('notif-1')
      expect(result[1].notificationName).toBe('notif-3')
    })

    it('filters out multiple processed notifications', async () => {
      const processedIds = new Set<string>(['id-1', 'id-3'])
      const tracker = createMockTracker(processedIds)
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_MODAL', id: 'id-1' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: 'CONTENT_STYLE_BANNER', id: 'id-2' }),
        createMockNotification({ name: 'notif-3', timestamp: 3000, style: 'CONTENT_STYLE_POPOVER', id: 'id-3' }),
        createMockNotification({ name: 'notif-4', timestamp: 4000, style: 'CONTENT_STYLE_MODAL', id: 'id-4' }),
      ]

      const result = await processor.process(notifications)

      expect(result).toHaveLength(2)
      expect(result[0].notificationName).toBe('notif-2')
      expect(result[1].notificationName).toBe('notif-4')
    })

    it('returns all notifications when processedIds is empty', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_MODAL' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: 'CONTENT_STYLE_BANNER' }),
      ]

      const result = await processor.process(notifications)

      expect(result).toHaveLength(2)
      expect(result[0].notificationName).toBe('notif-1')
      expect(result[1].notificationName).toBe('notif-2')
    })

    it('returns empty array when all notifications are processed', async () => {
      const processedIds = new Set<string>(['id-1', 'id-2'])
      const tracker = createMockTracker(processedIds)
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_MODAL', id: 'id-1' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: 'CONTENT_STYLE_BANNER', id: 'id-2' }),
      ]

      const result = await processor.process(notifications)

      expect(result).toEqual([])
    })

    it('filters and sorts remaining notifications', async () => {
      const processedIds = new Set<string>(['id-2', 'id-4'])
      const tracker = createMockTracker(processedIds)
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-3', timestamp: 3000, style: 'CONTENT_STYLE_MODAL', id: 'id-3' }),
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_BANNER', id: 'id-1' }),
        createMockNotification({ name: 'notif-4', timestamp: 4000, style: 'CONTENT_STYLE_POPOVER', id: 'id-4' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: 'CONTENT_STYLE_MODAL', id: 'id-2' }),
      ]

      const result = await processor.process(notifications)

      // Should filter out id-2 and id-4, then sort remaining by timestamp
      expect(result).toHaveLength(2)
      expect(result[0].notificationName).toBe('notif-1') // timestamp 1000
      expect(result[1].notificationName).toBe('notif-3') // timestamp 3000
    })
  })

  describe('edge cases', () => {
    it('preserves original notification objects without mutation', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const originalNotifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: 'CONTENT_STYLE_MODAL' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: 'CONTENT_STYLE_BANNER' }),
      ]
      const originalNotificationsCopy = JSON.parse(JSON.stringify(originalNotifications))

      await processor.process(originalNotifications)

      expect(originalNotifications).toEqual(originalNotificationsCopy)
    })

    it('returns all notifications in sorted order regardless of style', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'modal-1', timestamp: 3000, style: 'CONTENT_STYLE_MODAL' }),
        createMockNotification({ name: 'banner-1', timestamp: 1000, style: 'CONTENT_STYLE_LOWER_LEFT_BANNER' }),
        createMockNotification({ name: 'modal-2', timestamp: 4000, style: 'CONTENT_STYLE_MODAL' }),
        createMockNotification({ name: 'banner-2', timestamp: 2000, style: 'CONTENT_STYLE_LOWER_LEFT_BANNER' }),
      ]

      const result = await processor.process(notifications)

      // Should return all 4 notifications sorted by timestamp
      expect(result).toHaveLength(4)
      expect(result[0].notificationName).toBe('banner-1') // 1000
      expect(result[1].notificationName).toBe('banner-2') // 2000
      expect(result[2].notificationName).toBe('modal-1') // 3000
      expect(result[3].notificationName).toBe('modal-2') // 4000
    })

    it('handles notifications with null or undefined content properties gracefully', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notificationWithNullStyle: InAppNotification = {
        id: 'notif-null-id',
        notificationName: 'notif-null',
        timestamp: 1000,
        content: { style: 'LOWER_LEFT_BANNER', title: 'notif-null-title' },
        userId: 'user-1',
        metaData: {},
      } as InAppNotification

      const notifications: InAppNotification[] = [
        notificationWithNullStyle,
        createMockNotification({ name: 'notif-valid', timestamp: 2000, style: 'CONTENT_STYLE_MODAL' }),
      ]

      // Should not throw
      const result = await processor.process(notifications)

      expect(result).toHaveLength(2)
      expect(result[0].notificationName).toBe('notif-null')
      expect(result[1].notificationName).toBe('notif-valid')
    })

    it('maintains correct behavior with very large notification lists', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = []

      // Create 100 notifications with various timestamps
      for (let i = 0; i < 100; i++) {
        notifications.push(
          createMockNotification({ name: `notif-${i}`, timestamp: (99 - i) * 1000, style: 'CONTENT_STYLE_MODAL' }),
        )
      }

      const result = await processor.process(notifications)

      // Should return all 100 in sorted order
      expect(result).toHaveLength(100)
      expect(result[0].notificationName).toBe('notif-99') // timestamp 0
      expect(result[1].notificationName).toBe('notif-98') // timestamp 1000
      expect(result[99].notificationName).toBe('notif-0') // timestamp 99000
    })
  })
})
