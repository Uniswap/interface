import type { PlainMessage } from '@bufbuild/protobuf'
import {
  BackgroundType,
  Button,
  Content,
  ContentStyle,
  Notification,
  OnClickAction,
  AckNotificationRequest as ProtoAckNotificationRequest,
  AckNotificationResponse as ProtoAckNotificationResponse,
  GetNotificationsRequest as ProtoGetNotificationsRequest,
  GetNotificationsResponse as ProtoGetNotificationsResponse,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { FetchClient } from '@universe/api/src/clients/base/types'

export interface NotificationsClientContext {
  fetchClient: FetchClient
  getApiPathPrefix?: () => string
}

/**
 * Content style types for notifications
 */
export { ContentStyle, BackgroundType, OnClickAction }

/**
 * Content style type for convenience (union of ContentStyle enum values)
 */
export type NotificationContentStyle = ContentStyle

/**
 * Button configuration for notification content
 * Re-exported from @uniswap/client-notification-service
 * Note: This is the Message class instance, not a plain object.
 * Used within Content which comes from deserialized notifications.
 */
export type NotificationButton = Button

/**
 * Notification content
 * Re-exported from @uniswap/client-notification-service
 *
 * Notification API Type Mapping:
 * - content.title → Modal title
 * - content.subtitle → Modal subtitle
 * - content.background.link → Background image URL (when backgroundType is IMAGE)
 * - content.body.items[] → Feature list with icons and text
 * - content.buttons[] → Action buttons
 *
 * Note: This is the Message class instance, not a plain object.
 * Enum values are numbers at runtime, but toJSON() serializes them as strings.
 */
export type NotificationContent = Content

/**
 * In-app notification returned by the notifications API
 * Re-exported from @uniswap/client-notification-service
 * Note: This is a plain object (not a Message class instance) to prevent
 * React Query's structural cloning from triggering toJSON() which would
 * convert numeric enum values to strings.
 */
export type InAppNotification = PlainMessage<Notification>

/**
 * Request parameters for fetching notifications
 * Re-exported from @uniswap/client-notification-service
 */
export type GetNotificationsRequest = PlainMessage<ProtoGetNotificationsRequest>

/**
 * Response from the GetNotifications API endpoint
 * Re-exported from @uniswap/client-notification-service
 * Note: This is the Message class instance from protobuf deserialization.
 */
export type GetNotificationsResponse = ProtoGetNotificationsResponse

/**
 * Request parameters for acknowledging notifications
 * Re-exported from @uniswap/client-notification-service
 */
export type AckNotificationRequest = PlainMessage<ProtoAckNotificationRequest>

/**
 * Response from the AckNotifications API endpoint
 * Re-exported from @uniswap/client-notification-service
 */
export type AckNotificationResponse = PlainMessage<ProtoAckNotificationResponse>

export interface NotificationsApiClient {
  /**
   * Fetch notifications for the current user
   * Uses session-based authentication (x-session-id header) via FetchClient
   * Returns the raw GetNotificationsResponse message from protobuf deserialization
   */
  getNotifications: (params?: GetNotificationsRequest) => Promise<GetNotificationsResponse>

  /**
   * Acknowledge that a notification has been tracked/processed
   * Uses session-based authentication (x-session-id header) via FetchClient
   */
  ackNotification: (request: AckNotificationRequest) => Promise<AckNotificationResponse>
}
