import type { InAppNotification } from '@universe/api'
import { createNotificationProcessor } from '@universe/notifications/src/notification-processor/implementations/createNotificationProcessor'
import { describe, expect, it, vi } from 'vitest'

describe('createNotificationProcessor', () => {
  it('creates a notification processor with process method', () => {
    const mockProcess = vi.fn()
    const processor = createNotificationProcessor({
      process: mockProcess,
    })

    expect(processor).toBeDefined()
    expect(typeof processor.process).toBe('function')
  })

  it('delegates process call to injected process function', async () => {
    const mockNotifications: InAppNotification[] = [
      {
        id: 'test-notif-1-id',
        metaData: {},
        notificationName: 'test-notif-1',
        timestamp: 1000,
        content: { style: 'CONTENT_STYLE_MODAL', title: 'test-notif-1-title' },
        userId: 'user-1',
      } as InAppNotification,
    ]
    const mockResult: InAppNotification[] = [
      {
        id: 'result-notif-id',
        metaData: {},
        notificationName: 'result-notif',
        timestamp: 2000,
        content: { style: 'CONTENT_STYLE_MODAL', title: 'result-notif-title' },
        userId: 'user-1',
      } as InAppNotification,
    ]

    const mockProcess = vi.fn().mockResolvedValue(mockResult)
    const processor = createNotificationProcessor({
      process: mockProcess,
    })

    const result = await processor.process(mockNotifications)

    expect(mockProcess).toHaveBeenCalledWith(mockNotifications)
    expect(result).toBe(mockResult)
  })

  it('preserves the exact arguments passed to process method', async () => {
    const notifications: InAppNotification[] = [
      {
        id: 'notif-1-id',
        metaData: {},
        notificationName: 'notif-1',
        timestamp: 1000,
        content: { style: 'CONTENT_STYLE_MODAL', title: 'notif-1-title' },
        userId: 'user-1',
      } as InAppNotification,
      {
        id: 'notif-2-id',
        metaData: {},
        notificationName: 'notif-2',
        timestamp: 2000,
        content: { style: 'CONTENT_STYLE_BANNER', title: 'notif-2-title' },
        userId: 'user-1',
      } as InAppNotification,
    ]

    let capturedNotifications: InAppNotification[] | undefined

    const mockProcess = vi.fn(async (notifs) => {
      capturedNotifications = notifs
      return []
    })

    const processor = createNotificationProcessor({
      process: mockProcess,
    })

    await processor.process(notifications)

    expect(capturedNotifications).toBe(notifications)
  })

  it('returns empty array when injected process returns empty array', async () => {
    const mockProcess = vi.fn().mockResolvedValue([])
    const processor = createNotificationProcessor({
      process: mockProcess,
    })

    const result = await processor.process([])

    expect(result).toEqual([])
  })

  it('handles multiple calls with different arguments', async () => {
    const mockProcess = vi.fn(async (notifications) => notifications)
    const processor = createNotificationProcessor({
      process: mockProcess,
    })

    const notifs1: InAppNotification[] = [
      {
        id: 'notif-1-id',
        metaData: {},
        notificationName: 'notif-1',
        timestamp: 1000,
        content: { style: 'CONTENT_STYLE_MODAL', title: 'notif-1-title' },
        userId: 'user-1',
      } as InAppNotification,
    ]
    const notifs2: InAppNotification[] = [
      {
        id: 'notif-2-id',
        metaData: {},
        notificationName: 'notif-2',
        timestamp: 2000,
        content: { style: 'CONTENT_STYLE_BANNER', title: 'notif-2-title' },
        userId: 'user-1',
      } as InAppNotification,
    ]

    const result1 = await processor.process(notifs1)
    const result2 = await processor.process(notifs2)

    expect(mockProcess).toHaveBeenCalledTimes(2)
    expect(result1).toEqual(notifs1)
    expect(result2).toEqual(notifs2)
  })
})
