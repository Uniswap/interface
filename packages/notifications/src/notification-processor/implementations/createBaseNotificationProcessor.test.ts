import { ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { createBaseNotificationProcessor } from '@universe/notifications/src/notification-processor/implementations/createBaseNotificationProcessor'
import type { NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { describe, expect, it } from 'vitest'

describe('createBaseNotificationProcessor', () => {
  const createMockNotification = (params: {
    name: string
    timestamp: number
    style: ContentStyle
    id?: string
    includeDismiss?: boolean
  }): InAppNotification =>
    ({
      id: params.id ?? `${params.name}-id`,
      notificationName: params.name,
      timestamp: params.timestamp,
      content: {
        style: params.style,
        title: `${params.name}-title`,
        subtitle: '',
        version: 0,
        buttons:
          params.includeDismiss !== false
            ? [
                {
                  text: 'Dismiss',
                  isPrimary: false,
                  onClick: {
                    onClick: [OnClickAction.DISMISS],
                  },
                },
              ]
            : [],
      },
      metaData: {},
      userId: 'user-1',
    }) as unknown as InAppNotification

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

  describe('notification limiting by content style', () => {
    it('limits MODAL notifications to 1', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'modal-1', timestamp: 1000, style: ContentStyle.MODAL }),
        createMockNotification({ name: 'modal-2', timestamp: 2000, style: ContentStyle.MODAL }),
        createMockNotification({ name: 'modal-3', timestamp: 3000, style: ContentStyle.MODAL }),
      ]

      const result = await processor.process(notifications)

      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('modal-1-id')
    })

    it('limits UNSPECIFIED notifications to 1', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'unspec-1', timestamp: 1000, style: ContentStyle.UNSPECIFIED }),
        createMockNotification({ name: 'unspec-2', timestamp: 2000, style: ContentStyle.UNSPECIFIED }),
      ]

      const result = await processor.process(notifications)

      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('unspec-1-id')
    })

    it('allows up to 3 LOWER_LEFT_BANNER notifications', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'banner-1', timestamp: 1000, style: ContentStyle.LOWER_LEFT_BANNER }),
        createMockNotification({ name: 'banner-2', timestamp: 2000, style: ContentStyle.LOWER_LEFT_BANNER }),
        createMockNotification({ name: 'banner-3', timestamp: 3000, style: ContentStyle.LOWER_LEFT_BANNER }),
        createMockNotification({ name: 'banner-4', timestamp: 4000, style: ContentStyle.LOWER_LEFT_BANNER }),
      ]

      const result = await processor.process(notifications)

      expect(result.primary).toHaveLength(3)
      expect(result.primary[0].id).toBe('banner-1-id')
      expect(result.primary[1].id).toBe('banner-2-id')
      expect(result.primary[2].id).toBe('banner-3-id')
    })

    it('limits each style independently', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'modal-1', timestamp: 1000, style: ContentStyle.MODAL }),
        createMockNotification({ name: 'modal-2', timestamp: 2000, style: ContentStyle.MODAL }),
        createMockNotification({ name: 'banner-1', timestamp: 3000, style: ContentStyle.LOWER_LEFT_BANNER }),
        createMockNotification({ name: 'banner-2', timestamp: 4000, style: ContentStyle.LOWER_LEFT_BANNER }),
        createMockNotification({ name: 'banner-3', timestamp: 5000, style: ContentStyle.LOWER_LEFT_BANNER }),
      ]

      const result = await processor.process(notifications)

      // Should have 1 modal + 3 banners = 4 total
      expect(result.primary).toHaveLength(4)
      const modalResults = result.primary.filter((n) => n.content?.style === ContentStyle.MODAL)
      const bannerResults = result.primary.filter((n) => n.content?.style === ContentStyle.LOWER_LEFT_BANNER)
      expect(modalResults).toHaveLength(1)
      expect(bannerResults).toHaveLength(3)
    })

    it('handles notifications without content style as UNSPECIFIED and limits to 1', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifWithoutStyle: InAppNotification = {
        id: 'notif-no-style-1',
        content: {
          title: 'notif-no-style-title',
          subtitle: '',
          version: 0,
          buttons: [
            {
              text: 'Dismiss',
              onClick: { onClick: [OnClickAction.DISMISS] },
            },
          ],
        },
      } as unknown as InAppNotification
      const notifWithoutStyle2: InAppNotification = {
        id: 'notif-no-style-2',
        content: {
          title: 'notif-no-style-title',
          subtitle: '',
          version: 0,
          buttons: [
            {
              text: 'Dismiss',
              onClick: { onClick: [OnClickAction.DISMISS] },
            },
          ],
        },
      } as unknown as InAppNotification
      const notifications: InAppNotification[] = [notifWithoutStyle, notifWithoutStyle2]

      const result = await processor.process(notifications)

      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('notif-no-style-1')
    })

    it('handles empty notifications array', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const result = await processor.process([])

      expect(result.primary).toEqual([])
    })

    it('handles single notification', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: ContentStyle.MODAL }),
      ]

      const result = await processor.process(notifications)

      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('notif-1-id')
    })
  })

  describe('filtering processed notifications', () => {
    it('filters out notifications that are in processedIds', async () => {
      const processedIds = new Set<string>(['id-2'])
      const tracker = createMockTracker(processedIds)
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: ContentStyle.MODAL, id: 'id-1' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: ContentStyle.LOWER_LEFT_BANNER, id: 'id-2' }),
        createMockNotification({ name: 'notif-3', timestamp: 3000, style: ContentStyle.MODAL, id: 'id-3' }),
      ]

      const result = await processor.process(notifications)

      // Since both remaining notifications are MODAL style, only 1 should be returned
      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('id-1')
    })

    it('filters out multiple processed notifications', async () => {
      const processedIds = new Set<string>(['id-1', 'id-3'])
      const tracker = createMockTracker(processedIds)
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: ContentStyle.MODAL, id: 'id-1' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: ContentStyle.LOWER_LEFT_BANNER, id: 'id-2' }),
        createMockNotification({ name: 'notif-3', timestamp: 3000, style: ContentStyle.MODAL, id: 'id-3' }),
        createMockNotification({ name: 'notif-4', timestamp: 4000, style: ContentStyle.MODAL, id: 'id-4' }),
      ]

      const result = await processor.process(notifications)

      // Remaining: id-2 (banner), id-4 (modal) - both should be returned
      expect(result.primary).toHaveLength(2)
      const resultIds = result.primary.map((n) => n.id)
      expect(resultIds).toContain('id-2')
      expect(resultIds).toContain('id-4')
    })

    it('returns notifications with limits when processedIds is empty', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: ContentStyle.MODAL }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: ContentStyle.LOWER_LEFT_BANNER }),
      ]

      const result = await processor.process(notifications)

      expect(result.primary).toHaveLength(2)
    })

    it('filters out notifications without DISMISS action', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: ContentStyle.MODAL }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: ContentStyle.MODAL, includeDismiss: false }),
        createMockNotification({ name: 'notif-3', timestamp: 3000, style: ContentStyle.MODAL }),
      ]

      const result = await processor.process(notifications)

      // notif-2 should be filtered out because it has no DISMISS action
      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('notif-1-id')
    })

    it('allows notifications with DISMISS in background click', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notificationWithBgDismiss: InAppNotification = {
        id: 'bg-dismiss-id',
        content: {
          style: ContentStyle.MODAL,
          title: 'notif-title',
          subtitle: '',
          version: 0,
          buttons: [],
          background: {
            backgroundOnClick: {
              onClick: [OnClickAction.DISMISS],
            },
          },
        },
      } as unknown as InAppNotification

      const result = await processor.process([notificationWithBgDismiss])

      expect(result.primary).toHaveLength(1)
    })

    it('allows notifications with DISMISS in onDismissClick', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notificationWithOnDismissClick: InAppNotification = {
        id: 'dismiss-click-id',
        content: {
          style: ContentStyle.MODAL,
          title: 'notif-title',
          subtitle: '',
          version: 0,
          buttons: [],
          onDismissClick: {
            onClick: [OnClickAction.DISMISS],
          },
        },
      } as unknown as InAppNotification

      const result = await processor.process([notificationWithOnDismissClick])

      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('dismiss-click-id')
    })

    it('returns empty array when all notifications are processed', async () => {
      const processedIds = new Set<string>(['id-1', 'id-2'])
      const tracker = createMockTracker(processedIds)
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: ContentStyle.MODAL, id: 'id-1' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: ContentStyle.LOWER_LEFT_BANNER, id: 'id-2' }),
      ]

      const result = await processor.process(notifications)

      expect(result.primary).toEqual([])
    })

    it('filters and limits remaining notifications', async () => {
      const processedIds = new Set<string>(['id-2', 'id-4'])
      const tracker = createMockTracker(processedIds)
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-3', timestamp: 3000, style: ContentStyle.MODAL, id: 'id-3' }),
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: ContentStyle.LOWER_LEFT_BANNER, id: 'id-1' }),
        createMockNotification({ name: 'notif-4', timestamp: 4000, style: ContentStyle.MODAL, id: 'id-4' }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: ContentStyle.MODAL, id: 'id-2' }),
      ]

      const result = await processor.process(notifications)

      // Should filter out id-2 and id-4, leaving notif-3 (modal) and notif-1 (banner)
      expect(result.primary).toHaveLength(2)
      const resultIds = result.primary.map((n) => n.id)
      expect(resultIds).toContain('id-3')
      expect(resultIds).toContain('id-1')
    })
  })

  describe('edge cases', () => {
    it('preserves original notification objects without mutation', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const originalNotifications: InAppNotification[] = [
        createMockNotification({ name: 'notif-1', timestamp: 1000, style: ContentStyle.MODAL }),
        createMockNotification({ name: 'notif-2', timestamp: 2000, style: ContentStyle.LOWER_LEFT_BANNER }),
      ]
      const originalNotificationsCopy = JSON.parse(JSON.stringify(originalNotifications))

      await processor.process(originalNotifications)

      expect(originalNotifications).toEqual(originalNotificationsCopy)
    })

    it('applies limits correctly across multiple styles', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = [
        createMockNotification({ name: 'modal-1', timestamp: 3000, style: ContentStyle.MODAL }),
        createMockNotification({ name: 'banner-1', timestamp: 1000, style: ContentStyle.LOWER_LEFT_BANNER }),
        createMockNotification({ name: 'modal-2', timestamp: 4000, style: ContentStyle.MODAL }),
        createMockNotification({ name: 'banner-2', timestamp: 2000, style: ContentStyle.LOWER_LEFT_BANNER }),
      ]

      const result = await processor.process(notifications)

      // Should limit modals to 1 and keep both banners (limit is 3)
      expect(result.primary).toHaveLength(3)
      const modalResults = result.primary.filter((n) => n.content?.style === ContentStyle.MODAL)
      const bannerResults = result.primary.filter((n) => n.content?.style === ContentStyle.LOWER_LEFT_BANNER)
      expect(modalResults).toHaveLength(1)
      expect(bannerResults).toHaveLength(2)
    })

    it('handles notifications with undefined content gracefully', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notificationWithoutContent: InAppNotification = {
        id: 'notif-null-id',
      } as unknown as InAppNotification

      const notifications: InAppNotification[] = [
        notificationWithoutContent,
        createMockNotification({ name: 'notif-valid', timestamp: 2000, style: ContentStyle.MODAL }),
      ]

      // Should not throw, but notif-null-id should be filtered out (no DISMISS action)
      const result = await processor.process(notifications)

      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('notif-valid-id')
    })

    it('limits notifications correctly with large lists', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)
      const notifications: InAppNotification[] = []

      // Create 50 modal and 50 banner notifications
      for (let i = 0; i < 50; i++) {
        notifications.push(
          createMockNotification({ name: `modal-${i}`, timestamp: i * 1000, style: ContentStyle.MODAL }),
        )
        notifications.push(
          createMockNotification({ name: `banner-${i}`, timestamp: i * 1000, style: ContentStyle.LOWER_LEFT_BANNER }),
        )
      }

      const result = await processor.process(notifications)

      // Should limit to 1 modal and 3 banners = 4 total
      expect(result.primary).toHaveLength(4)
      const modalResults = result.primary.filter((n) => n.content?.style === ContentStyle.MODAL)
      const bannerResults = result.primary.filter((n) => n.content?.style === ContentStyle.LOWER_LEFT_BANNER)
      expect(modalResults).toHaveLength(1)
      expect(bannerResults).toHaveLength(3)
    })
  })

  describe('chained notifications', () => {
    it('identifies simple chain: A → B', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)

      const notificationB = createMockNotification({
        name: 'notif-B',
        timestamp: 2000,
        style: ContentStyle.MODAL,
        id: 'notif-B',
      })

      const notificationA: InAppNotification = {
        id: 'notif-A',
        notificationName: 'notif-A',
        timestamp: 1000,
        content: {
          style: ContentStyle.MODAL,
          title: 'notif-A-title',
          subtitle: '',
          version: 0,
          buttons: [
            {
              label: 'Show B',
              onClick: {
                onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
                onClickLink: 'notif-B',
              },
            },
          ],
        },
        metaData: {},
        userId: 'user-1',
      } as unknown as InAppNotification

      const notifications = [notificationA, notificationB]
      const result = await processor.process(notifications)

      // A should be primary (no incoming edges)
      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('notif-A')

      // B should be chained (has incoming edge from A)
      expect(result.chained.size).toBe(1)
      expect(result.chained.has('notif-B')).toBe(true)
    })

    it('handles chain of length 3: A → B → C', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)

      const notificationC = createMockNotification({
        name: 'notif-C',
        timestamp: 3000,
        style: ContentStyle.MODAL,
        id: 'notif-C',
      })

      const notificationB: InAppNotification = {
        id: 'notif-B',
        notificationName: 'notif-B',
        timestamp: 2000,
        content: {
          style: ContentStyle.MODAL,
          title: 'notif-B-title',
          subtitle: '',
          version: 0,
          buttons: [
            {
              label: 'Show C',
              onClick: {
                onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
                onClickLink: 'notif-C',
              },
            },
          ],
        },
        metaData: {},
        userId: 'user-1',
      } as unknown as InAppNotification

      const notificationA: InAppNotification = {
        id: 'notif-A',
        notificationName: 'notif-A',
        timestamp: 1000,
        content: {
          style: ContentStyle.MODAL,
          title: 'notif-A-title',
          subtitle: '',
          version: 0,
          buttons: [
            {
              label: 'Show B',
              onClick: {
                onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
                onClickLink: 'notif-B',
              },
            },
          ],
        },
        metaData: {},
        userId: 'user-1',
      } as unknown as InAppNotification

      const notifications = [notificationA, notificationB, notificationC]
      const result = await processor.process(notifications)

      // Only A should be primary (no incoming edges)
      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('notif-A')

      // B and C should be chained (have incoming edges)
      expect(result.chained.size).toBe(2)
      expect(result.chained.has('notif-B')).toBe(true)
      expect(result.chained.has('notif-C')).toBe(true)
    })

    it('handles chain of length 5: A → B → C → D → E', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)

      const createChainNotification = (id: string, nextId?: string): InAppNotification =>
        ({
          id,
          notificationName: id,
          timestamp: 1000,
          content: {
            style: ContentStyle.MODAL,
            title: `${id}-title`,
            subtitle: '',
            version: 0,
            buttons: nextId
              ? [
                  {
                    label: `Show ${nextId}`,
                    onClick: {
                      onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
                      onClickLink: nextId,
                    },
                  },
                ]
              : [
                  {
                    label: 'Dismiss',
                    onClick: {
                      onClick: [OnClickAction.DISMISS],
                    },
                  },
                ],
          },
          metaData: {},
          userId: 'user-1',
        }) as unknown as InAppNotification

      const notificationE = createChainNotification('notif-E')
      const notificationD = createChainNotification('notif-D', 'notif-E')
      const notificationC = createChainNotification('notif-C', 'notif-D')
      const notificationB = createChainNotification('notif-B', 'notif-C')
      const notificationA = createChainNotification('notif-A', 'notif-B')

      const notifications = [notificationA, notificationB, notificationC, notificationD, notificationE]
      const result = await processor.process(notifications)

      // Only A should be primary (no incoming edges)
      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('notif-A')

      // B, C, D, E should all be chained
      expect(result.chained.size).toBe(4)
      expect(result.chained.has('notif-B')).toBe(true)
      expect(result.chained.has('notif-C')).toBe(true)
      expect(result.chained.has('notif-D')).toBe(true)
      expect(result.chained.has('notif-E')).toBe(true)
    })

    it('handles multiple independent chains', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)

      const createChainNotification = ({
        id,
        style,
        nextId,
      }: {
        id: string
        style: ContentStyle
        nextId?: string
      }): InAppNotification =>
        ({
          id,
          notificationName: id,
          timestamp: 1000,
          content: {
            style,
            title: `${id}-title`,
            subtitle: '',
            version: 0,
            buttons: nextId
              ? [
                  {
                    label: `Show ${nextId}`,
                    onClick: {
                      onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
                      onClickLink: nextId,
                    },
                  },
                ]
              : [
                  {
                    label: 'Dismiss',
                    onClick: {
                      onClick: [OnClickAction.DISMISS],
                    },
                  },
                ],
          },
          metaData: {},
          userId: 'user-1',
        }) as unknown as InAppNotification

      // Chain 1: A → B → C (use MODAL style)
      const notificationC = createChainNotification({ id: 'notif-C', style: ContentStyle.MODAL })
      const notificationB = createChainNotification({ id: 'notif-B', style: ContentStyle.MODAL, nextId: 'notif-C' })
      const notificationA = createChainNotification({ id: 'notif-A', style: ContentStyle.MODAL, nextId: 'notif-B' })

      // Chain 2: X → Y (use LOWER_LEFT_BANNER style so it doesn't conflict with the MODAL limit)
      const notificationY = createChainNotification({ id: 'notif-Y', style: ContentStyle.LOWER_LEFT_BANNER })
      const notificationX = createChainNotification({
        id: 'notif-X',
        style: ContentStyle.LOWER_LEFT_BANNER,
        nextId: 'notif-Y',
      })

      const notifications = [notificationA, notificationB, notificationC, notificationX, notificationY]
      const result = await processor.process(notifications)

      // A and X should be primary (roots of their chains)
      expect(result.primary).toHaveLength(2)
      const primaryIds = result.primary.map((n) => n.id)
      expect(primaryIds).toContain('notif-A')
      expect(primaryIds).toContain('notif-X')

      // B, C, Y should be chained
      expect(result.chained.size).toBe(3)
      expect(result.chained.has('notif-B')).toBe(true)
      expect(result.chained.has('notif-C')).toBe(true)
      expect(result.chained.has('notif-Y')).toBe(true)
    })

    it('handles notification with multiple parents (diamond pattern)', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)

      const notificationD = createMockNotification({
        name: 'notif-D',
        timestamp: 4000,
        style: ContentStyle.MODAL,
        id: 'notif-D',
      })

      // B and C both point to D
      const notificationC: InAppNotification = {
        id: 'notif-C',
        notificationName: 'notif-C',
        timestamp: 3000,
        content: {
          style: ContentStyle.MODAL,
          title: 'notif-C-title',
          subtitle: '',
          version: 0,
          buttons: [
            {
              label: 'Show D',
              onClick: {
                onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
                onClickLink: 'notif-D',
              },
            },
          ],
        },
        metaData: {},
        userId: 'user-1',
      } as unknown as InAppNotification

      const notificationB: InAppNotification = {
        id: 'notif-B',
        notificationName: 'notif-B',
        timestamp: 2000,
        content: {
          style: ContentStyle.MODAL,
          title: 'notif-B-title',
          subtitle: '',
          version: 0,
          buttons: [
            {
              label: 'Show D',
              onClick: {
                onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
                onClickLink: 'notif-D',
              },
            },
          ],
        },
        metaData: {},
        userId: 'user-1',
      } as unknown as InAppNotification

      // A points to both B and C
      const notificationA: InAppNotification = {
        id: 'notif-A',
        notificationName: 'notif-A',
        timestamp: 1000,
        content: {
          style: ContentStyle.MODAL,
          title: 'notif-A-title',
          subtitle: '',
          version: 0,
          buttons: [
            {
              label: 'Show B',
              onClick: {
                onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
                onClickLink: 'notif-B',
              },
            },
            {
              label: 'Show C',
              onClick: {
                onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
                onClickLink: 'notif-C',
              },
            },
          ],
        },
        metaData: {},
        userId: 'user-1',
      } as unknown as InAppNotification

      const notifications = [notificationA, notificationB, notificationC, notificationD]
      const result = await processor.process(notifications)

      // Only A should be primary (has no incoming edges)
      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('notif-A')

      // B, C, D should all be chained (all have incoming edges)
      expect(result.chained.size).toBe(3)
      expect(result.chained.has('notif-B')).toBe(true)
      expect(result.chained.has('notif-C')).toBe(true)
      expect(result.chained.has('notif-D')).toBe(true)
    })

    it('handles background onClick with POPUP action', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)

      const notificationB = createMockNotification({
        name: 'notif-B',
        timestamp: 2000,
        style: ContentStyle.MODAL,
        id: 'notif-B',
      })

      const notificationA: InAppNotification = {
        id: 'notif-A',
        notificationName: 'notif-A',
        timestamp: 1000,
        content: {
          style: ContentStyle.MODAL,
          title: 'notif-A-title',
          subtitle: '',
          version: 0,
          buttons: [
            {
              text: 'Dismiss',
              onClick: { onClick: [OnClickAction.DISMISS] },
            },
          ],
          background: {
            backgroundOnClick: {
              onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
              onClickLink: 'notif-B',
            },
          },
        },
        metaData: {},
        userId: 'user-1',
      } as unknown as InAppNotification

      const notifications = [notificationA, notificationB]
      const result = await processor.process(notifications)

      // A should be primary
      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('notif-A')

      // B should be chained (referenced by A's background onClick)
      expect(result.chained.size).toBe(1)
      expect(result.chained.has('notif-B')).toBe(true)
    })

    it('ignores POPUP references to notifications not in the batch', async () => {
      const tracker = createMockTracker()
      const processor = createBaseNotificationProcessor(tracker)

      const notificationA: InAppNotification = {
        id: 'notif-A',
        notificationName: 'notif-A',
        timestamp: 1000,
        content: {
          style: ContentStyle.MODAL,
          title: 'notif-A-title',
          subtitle: '',
          version: 0,
          buttons: [
            {
              label: 'Show B',
              onClick: {
                onClick: [OnClickAction.POPUP, OnClickAction.DISMISS],
                onClickLink: 'notif-B-not-in-batch',
              },
            },
          ],
        },
        metaData: {},
        userId: 'user-1',
      } as unknown as InAppNotification

      const notifications = [notificationA]
      const result = await processor.process(notifications)

      // A should still be primary (references notification not in batch)
      expect(result.primary).toHaveLength(1)
      expect(result.primary[0].id).toBe('notif-A')

      // No chained notifications
      expect(result.chained.size).toBe(0)
    })
  })
})
