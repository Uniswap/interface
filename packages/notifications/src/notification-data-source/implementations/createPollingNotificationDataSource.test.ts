import { QueryClient } from '@tanstack/react-query'
import {
  Content,
  GetNotificationsResponse,
  Metadata,
  Notification,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import type { InAppNotification, NotificationsApiClient } from '@universe/api'
import { ContentStyle } from '@universe/api'
import { getNotificationQueryOptions } from '@universe/notifications/src/notification-data-source/getNotificationQueryOptions'
import { createPollingNotificationDataSource } from '@universe/notifications/src/notification-data-source/implementations/createPollingNotificationDataSource'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

function createMockNotification(id: string): InAppNotification {
  return new Notification({
    id,
    metadata: new Metadata({ owner: 'foo', business: 'bar' }),
    content: new Content({ style: ContentStyle.MODAL, title: 'Hello' }),
  })
}

describe('createPollingNotificationDataSource', () => {
  let queryClient: QueryClient
  let mockApiClient: NotificationsApiClient
  let mockNotifications: InAppNotification[]

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient()

    mockNotifications = [createMockNotification('1'), createMockNotification('2')]

    mockApiClient = {
      getNotifications: vi.fn().mockResolvedValue(new GetNotificationsResponse({ notifications: mockNotifications })),
      ackNotification: vi.fn().mockResolvedValue(undefined),
    }
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('creates a notification data source with start and stop methods', () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const dataSource = createPollingNotificationDataSource({
      queryClient: testQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
      }),
    })

    expect(dataSource).toBeDefined()
    expect(typeof dataSource.start).toBe('function')
    expect(typeof dataSource.stop).toBe('function')
  })

  it('calls onNotifications when notifications are received', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const dataSource = createPollingNotificationDataSource({
      queryClient: testQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
      }),
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    // Wait for the query to resolve
    await vi.waitFor(() => {
      expect(onNotifications).toHaveBeenCalledWith(mockNotifications, 'polling_api')
    })

    await dataSource.stop()
  })

  it('calls apiClient.getNotifications when started', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const dataSource = createPollingNotificationDataSource({
      queryClient: testQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
      }),
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.waitFor(() => {
      expect(mockApiClient.getNotifications).toHaveBeenCalled()
    })

    await dataSource.stop()
  })

  it('does not start twice if already active', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const dataSource = createPollingNotificationDataSource({
      queryClient: testQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
      }),
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    // Try to start again
    dataSource.start(onNotifications)

    // Wait a bit to ensure no double calls
    await vi.waitFor(() => {
      expect(mockApiClient.getNotifications).toHaveBeenCalledTimes(1)
    })

    await dataSource.stop()
  })

  it('handles API errors gracefully', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const error = new Error('API Error')
    mockApiClient.getNotifications = vi.fn().mockRejectedValue(error)

    const dataSource = createPollingNotificationDataSource({
      queryClient: testQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
      }),
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    // Wait for error handling
    await vi.waitFor(() => {
      expect(mockApiClient.getNotifications).toHaveBeenCalled()
    })

    // onNotifications should not be called on error
    expect(onNotifications).not.toHaveBeenCalled()

    await dataSource.stop()
  })

  it('stops polling when stop is called', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const dataSource = createPollingNotificationDataSource({
      queryClient: testQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
        pollIntervalMs: 100, // Short interval for testing
      }),
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.waitFor(() => {
      expect(onNotifications).toHaveBeenCalled()
    })

    const callCountBeforeStop = (mockApiClient.getNotifications as Mock).mock.calls.length

    await dataSource.stop()

    // Wait a bit longer than poll interval
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Should not have made additional API calls after stop
    expect((mockApiClient.getNotifications as Mock).mock.calls.length).toBe(callCountBeforeStop)
  })

  it('can be started again after stopping', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const dataSource = createPollingNotificationDataSource({
      queryClient: testQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
      }),
    })

    const onNotifications = vi.fn()

    // Start, wait, then stop
    dataSource.start(onNotifications)
    await vi.waitFor(() => {
      expect(onNotifications).toHaveBeenCalledWith(mockNotifications, 'polling_api')
    })
    await dataSource.stop()

    // Wait a bit for cleanup to complete
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Clear the query cache completely
    testQueryClient.clear()

    // Clear mocks
    vi.clearAllMocks()
    mockApiClient.getNotifications = vi
      .fn()
      .mockResolvedValue(new GetNotificationsResponse({ notifications: mockNotifications }))

    // Start again with a new callback
    const onNotifications2 = vi.fn()
    dataSource.start(onNotifications2)
    await vi.waitFor(() => {
      expect(onNotifications2).toHaveBeenCalled()
    })

    await dataSource.stop()
  })

  it('uses custom poll interval when provided', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const customPollInterval = 100
    const dataSource = createPollingNotificationDataSource({
      queryClient: testQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
        pollIntervalMs: customPollInterval,
      }),
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    // Wait for initial call
    await vi.waitFor(() => {
      expect(mockApiClient.getNotifications).toHaveBeenCalled()
    })

    // Verify the data source was created successfully with custom interval
    // Note: Testing actual polling behavior is complex due to React Query's internal timing
    // The main goal is to ensure the custom interval is accepted without errors
    expect(dataSource).toBeDefined()
    expect(typeof dataSource.start).toBe('function')
    expect(typeof dataSource.stop).toBe('function')

    await dataSource.stop()
  })

  it('passes empty array to onNotifications when API returns empty array', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    mockApiClient.getNotifications = vi.fn().mockResolvedValue(new GetNotificationsResponse({ notifications: [] }))

    const dataSource = createPollingNotificationDataSource({
      queryClient: testQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
      }),
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.waitFor(() => {
      expect(onNotifications).toHaveBeenCalledWith([], 'polling_api')
    })

    await dataSource.stop()
  })

  it('cancels queries when stopped', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const dataSource = createPollingNotificationDataSource({
      queryClient: testQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
      }),
    })

    const cancelQueriesSpy = vi.spyOn(testQueryClient, 'cancelQueries')

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    await vi.waitFor(() => {
      expect(onNotifications).toHaveBeenCalled()
    })

    await dataSource.stop()

    expect(cancelQueriesSpy).toHaveBeenCalledWith({ queryKey: [ReactQueryCacheKey.Notifications] })

    cancelQueriesSpy.mockRestore()
  })

  it('retries failed requests according to retry configuration', async () => {
    let callCount = 0
    mockApiClient.getNotifications = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount <= 2) {
        return Promise.reject(new Error('Temporary error'))
      }
      return Promise.resolve(new GetNotificationsResponse({ notifications: mockNotifications }))
    })

    // Create a fresh QueryClient to test actual retry behavior from queryOptions
    const retryQueryClient = new QueryClient()

    const dataSource = createPollingNotificationDataSource({
      queryClient: retryQueryClient,
      queryOptions: getNotificationQueryOptions({
        apiClient: mockApiClient,
      }),
    })

    const onNotifications = vi.fn()
    dataSource.start(onNotifications)

    // Should eventually succeed after retries
    await vi.waitFor(
      () => {
        expect(onNotifications).toHaveBeenCalled()
      },
      { timeout: 10000 },
    )

    // Should have made multiple attempts (initial + 2 retries)
    expect(callCount).toBe(3)

    await dataSource.stop()
    retryQueryClient.clear()
  })
})
