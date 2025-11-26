import type { QueryClient } from '@tanstack/react-query'
import type { NotificationsApiClient } from '@universe/api'
import { createApiNotificationTracker } from '@universe/notifications/src/notification-tracker/implementations/createApiNotificationTracker'
import type { TrackingMetadata } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { describe, expect, it, type Mock, vi } from 'vitest'

describe('createApiNotificationTracker', () => {
  const createMockApiClient = (): NotificationsApiClient =>
    ({
      ackNotification: vi.fn().mockResolvedValue(undefined),
    }) as unknown as NotificationsApiClient

  const createMockQueryClient = (): QueryClient =>
    ({
      fetchQuery: vi.fn((options) => options.queryFn()),
    }) as unknown as QueryClient

  const createMockStorage = (): {
    has: Mock<(notificationId: string) => Promise<boolean>>
    add: Mock<(notificationId: string, metadata?: { timestamp: number }) => Promise<void>>
    getAll: Mock<() => Promise<Set<string>>>
    deleteOlderThan: Mock<(timestamp: number) => Promise<void>>
  } => ({
    has: vi.fn().mockResolvedValue(false),
    add: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue(new Set<string>()),
    deleteOlderThan: vi.fn().mockResolvedValue(undefined),
  })

  const mockMetadata: TrackingMetadata = {
    timestamp: Date.now(),
  }

  describe('isProcessed', () => {
    it('returns true when storage has the notification', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()
      mockStorage.has.mockResolvedValue(true)

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      const result = await tracker.isProcessed('notif-1')

      expect(result).toBe(true)
      expect(mockStorage.has).toHaveBeenCalledWith('notif-1')
    })

    it('returns false when storage does not have the notification', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()
      mockStorage.has.mockResolvedValue(false)

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      const result = await tracker.isProcessed('notif-1')

      expect(result).toBe(false)
      expect(mockStorage.has).toHaveBeenCalledWith('notif-1')
    })
  })

  describe('getProcessedIds', () => {
    it('returns all IDs from storage when storage is provided', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()
      const expectedIds = new Set(['notif-1', 'notif-2', 'notif-3'])
      mockStorage.getAll.mockResolvedValue(expectedIds)

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      const result = await tracker.getProcessedIds()

      expect(result).toBe(expectedIds)
      expect(mockStorage.getAll).toHaveBeenCalled()
    })
  })

  describe('track', () => {
    it('calls API and updates storage on successful acknowledgment', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      await tracker.track('notif-1', mockMetadata)

      expect(mockApiClient.ackNotification).toHaveBeenCalledWith({
        ids: ['notif-1'],
      })
      expect(mockStorage.add).toHaveBeenCalledWith('notif-1', {
        timestamp: mockMetadata.timestamp,
      })
    })

    it('updates storage and logs error when API call fails', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()
      const apiError = new Error('API request failed')
      mockApiClient.ackNotification = vi.fn().mockRejectedValue(apiError)

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      // Should not throw - errors are caught and logged
      await expect(tracker.track('notif-1', mockMetadata)).resolves.not.toThrow()

      // Verify storage was still updated despite API failure
      expect(mockStorage.add).toHaveBeenCalledWith('notif-1', {
        timestamp: mockMetadata.timestamp,
      })
    })

    it('logs error when API fails and no storage provided', async () => {
      const mockApiClient = createMockApiClient()
      const apiError = new Error('Network error')
      mockApiClient.ackNotification = vi.fn().mockRejectedValue(apiError)

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        storage: createMockStorage(),
      })

      // Should not throw - errors are caught and logged
      await expect(tracker.track('notif-1', mockMetadata)).resolves.not.toThrow()
    })

    it('calls API and updates storage even when API fails', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()
      const apiError = new Error('Connection timeout')
      mockApiClient.ackNotification = vi.fn().mockRejectedValue(apiError)

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      // Should not throw - errors are caught and logged
      await tracker.track('notif-1', mockMetadata)

      // Verify API was called
      expect(mockApiClient.ackNotification).toHaveBeenCalledWith({
        ids: ['notif-1'],
      })

      // Verify storage was updated despite API failure
      expect(mockStorage.add).toHaveBeenCalledWith('notif-1', {
        timestamp: mockMetadata.timestamp,
      })
    })

    it('handles non-Error objects thrown by API', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()
      mockApiClient.ackNotification = vi.fn().mockRejectedValue('String error')

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      // Should not throw - errors are caught and logged
      await expect(tracker.track('notif-1', mockMetadata)).resolves.not.toThrow()

      // Verify storage was updated despite API failure
      expect(mockStorage.add).toHaveBeenCalledWith('notif-1', {
        timestamp: mockMetadata.timestamp,
      })
    })

    it('preserves metadata with different tracking strategies', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      const notificationIds = ['notif-1', 'notif-2', 'notif-3', 'notif-4']

      for (let i = 0; i < notificationIds.length; i++) {
        const metadata: TrackingMetadata = {
          timestamp: Date.now() + i,
        }

        await tracker.track(notificationIds[i], metadata)

        expect(mockStorage.add).toHaveBeenCalledWith(notificationIds[i], {
          timestamp: metadata.timestamp,
        })
      }
    })

    it('makes separate API calls for separate track invocations', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      await tracker.track('notif-1', mockMetadata)
      await tracker.track('notif-2', mockMetadata)
      await tracker.track('notif-3', mockMetadata)

      expect(mockApiClient.ackNotification).toHaveBeenCalledTimes(3)
      expect(mockApiClient.ackNotification).toHaveBeenNthCalledWith(1, { ids: ['notif-1'] })
      expect(mockApiClient.ackNotification).toHaveBeenNthCalledWith(2, { ids: ['notif-2'] })
      expect(mockApiClient.ackNotification).toHaveBeenNthCalledWith(3, { ids: ['notif-3'] })
    })
  })

  describe('cleanup', () => {
    it('calls storage deleteOlderThan when provided', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      expect(tracker.cleanup).toBeDefined()

      const timestamp = Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
      await tracker.cleanup?.(timestamp)

      expect(mockStorage.deleteOlderThan).toHaveBeenCalledWith(timestamp)
    })

    it('handles multiple cleanup calls with different timestamps', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      const timestamp1 = Date.now() - 7 * 24 * 60 * 60 * 1000
      const timestamp2 = Date.now() - 14 * 24 * 60 * 60 * 1000
      const timestamp3 = Date.now() - 30 * 24 * 60 * 60 * 1000

      await tracker.cleanup?.(timestamp1)
      await tracker.cleanup?.(timestamp2)
      await tracker.cleanup?.(timestamp3)

      expect(mockStorage.deleteOlderThan).toHaveBeenCalledTimes(3)
      expect(mockStorage.deleteOlderThan).toHaveBeenNthCalledWith(1, timestamp1)
      expect(mockStorage.deleteOlderThan).toHaveBeenNthCalledWith(2, timestamp2)
      expect(mockStorage.deleteOlderThan).toHaveBeenNthCalledWith(3, timestamp3)
    })
  })

  describe('integration scenarios', () => {
    it('prevents race condition: isProcessed returns true immediately after track is called', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()

      // Simulate slow storage writes (e.g., IndexedDB or localStorage)
      let storageWriteResolver: (() => void) | undefined
      const storageWritePromise = new Promise<void>((resolve) => {
        storageWriteResolver = resolve
      })
      mockStorage.add.mockReturnValue(storageWritePromise)

      // Storage hasn't been written to yet
      mockStorage.has.mockResolvedValue(false)

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      // Initially not processed
      expect(await tracker.isProcessed('notif-1')).toBe(false)

      // Start tracking (but don't await - simulates in-flight acknowledgment)
      const trackPromise = tracker.track('notif-1', mockMetadata)

      // CRITICAL: Even though storage.has still returns false and storage write hasn't completed,
      // isProcessed should return true due to in-memory pending set
      // This prevents notifications from re-appearing when data source refetches
      expect(await tracker.isProcessed('notif-1')).toBe(true)

      // Complete the storage write
      storageWriteResolver?.()
      await trackPromise

      // Still processed after storage write completes
      mockStorage.has.mockResolvedValue(true)
      expect(await tracker.isProcessed('notif-1')).toBe(true)
    })

    it('handles complete notification lifecycle', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      // Initially not processed
      mockStorage.has.mockResolvedValue(false)
      expect(await tracker.isProcessed('notif-1')).toBe(false)

      // Track notification
      await tracker.track('notif-1', mockMetadata)

      // Now marked as processed
      mockStorage.has.mockResolvedValue(true)
      expect(await tracker.isProcessed('notif-1')).toBe(true)

      // Appears in processed IDs
      mockStorage.getAll.mockResolvedValue(new Set(['notif-1']))
      expect(await tracker.getProcessedIds()).toEqual(new Set(['notif-1']))

      // Clean up old entries
      await tracker.cleanup?.(Date.now() - 1000)
      expect(mockStorage.deleteOlderThan).toHaveBeenCalled()
    })

    it('marks notification as processed even when storage fails (UX priority)', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      // Simulate storage failure
      mockStorage.add.mockRejectedValue(new Error('Storage quota exceeded'))
      mockStorage.has.mockResolvedValue(false)

      // Track should not throw - errors are caught and logged
      await expect(tracker.track('notif-1', mockMetadata)).resolves.not.toThrow()

      // Verify API was called
      expect(mockApiClient.ackNotification).toHaveBeenCalledWith({
        ids: ['notif-1'],
      })

      // CRITICAL: Even though storage failed, the notification should still be
      // considered processed due to in-memory pending set (UX priority)
      expect(await tracker.isProcessed('notif-1')).toBe(true)
    })

    it('tracks same notification multiple times independently without deduplication', async () => {
      const mockApiClient = createMockApiClient()
      const mockStorage = createMockStorage()

      const tracker = createApiNotificationTracker({
        notificationsApiClient: mockApiClient,
        queryClient: createMockQueryClient(),
        storage: mockStorage,
      })

      await tracker.track('notif-1', mockMetadata)
      await tracker.track('notif-1', { ...mockMetadata, timestamp: Date.now() + 1000 })
      await tracker.track('notif-1', { ...mockMetadata, timestamp: Date.now() + 2000 })

      // Each call should independently call the API and storage
      expect(mockApiClient.ackNotification).toHaveBeenCalledTimes(3)
      expect(mockStorage.add).toHaveBeenCalledTimes(3)
    })
  })
})
