import type {
  GetNotificationsRequest,
  InAppNotification,
  NotificationsApiClient,
  NotificationsClientContext,
} from '@universe/api/src/clients/notifications/types'

/**
 * Factory function to create a NotificationsApiClient
 *
 * Example usage:
 * ```typescript
 * const notificationsClient = createNotificationsApiClient({
 *   fetchClient: myFetchClient,
 *   getApiPathPrefix: () => '/notifications/v1'
 * })
 *
 * const notifications = await notificationsClient.getNotifications()
 * ```
 *
 * @param ctx - Context containing injected dependencies
 * @returns NotificationsApiClient instance
 */
export function createNotificationsApiClient(ctx: NotificationsClientContext): NotificationsApiClient {
  const { fetchClient, getApiPathPrefix = (): string => '' } = ctx

  const getNotifications = async (params?: GetNotificationsRequest): Promise<InAppNotification[]> => {
    const pathPrefix = getApiPathPrefix()
    const path = `${pathPrefix}/uniswap.notificationservice.v1.NotificationService/GetNotifications`

    try {
      const response = await fetchClient.post<{ notifications: InAppNotification[] }>(path, {
        body: JSON.stringify(params ?? {}),
      })

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return response?.notifications ?? []
    } catch (error) {
      // Re-throw with context about which API call failed
      throw new Error(`Failed to fetch notifications: ${error instanceof Error ? error.message : String(error)}`, {
        cause: error,
      })
    }
  }

  return {
    getNotifications,
  }
}
