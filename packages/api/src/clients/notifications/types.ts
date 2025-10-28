import { FetchClient } from '@universe/api/src/clients/base/types'

export interface NotificationsClientContext {
  fetchClient: FetchClient
  getApiPathPrefix?: () => string
}

/**
 * In-app notification returned by the notifications API
 * TODO: This will be replaced with OpenAPI-generated types once the spec is integrated
 */
export interface InAppNotification {
  notification_id: string
  notification_name: string
  meta_data: Record<string, unknown>
  content: Record<string, unknown>
  criteria: Record<string, unknown>
}

/**
 * Request parameters for fetching notifications
 */
export type GetNotificationsRequest = Record<string, unknown>

/**
 * Response from the GetNotifications API endpoint
 */
export interface GetNotificationsResponse {
  notifications: InAppNotification[]
}

export interface NotificationsApiClient {
  /**
   * Fetch notifications for the current user
   * Uses session-based authentication (x-session-id header) via FetchClient
   */
  getNotifications: (params?: GetNotificationsRequest) => Promise<InAppNotification[]>
}
