import { FetchClient } from '@universe/api/src/clients/base/types'

export interface NotificationsClientContext {
  fetchClient: FetchClient
  getApiPathPrefix?: () => string
}

/**
 * Content style types for notifications
 * These determine how the notification is displayed and deduplication rules
 * TODO: This will be replaced with OpenAPI-generated types once the spec is integrated
 */
export type NotificationContentStyle = 'CONTENT_STYLE_LOWER_LEFT_BANNER' | 'CONTENT_STYLE_MODAL' | string // Allow other styles that may be added

/**
 * Button configuration for notification content
 * TODO: This will be replaced with OpenAPI-generated types once the spec is integrated
 */
export interface NotificationButton {
  text: string
  onClickType: string
  onClickLink?: string
  isPrimary?: boolean
}

/**
 * TODO: This will be replaced with OpenAPI-generated types once the spec is integrated
 */
export interface NotificationContent {
  title: string
  subtitle?: string
  style: NotificationContentStyle
  buttons?: NotificationButton[]
  backgroundOnClickType?: string
  backgroundType?: string
  onDismissClick?: string
}

/**
 * In-app notification returned by the notifications API
 * TODO: This will be replaced with OpenAPI-generated types once the spec is integrated
 */
export interface InAppNotification {
  id: string
  notificationName: string
  metaData: Record<string, unknown>
  content: NotificationContent
  timestamp?: number
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
