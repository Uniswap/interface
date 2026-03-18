import { type InAppNotification } from '@universe/api'
import { type NotificationClickTarget } from '@universe/notifications'
import { useEffect } from 'react'
import { BackupReminderModal } from 'src/app/modals/BackupReminderModal'

interface BackupReminderModalRendererProps {
  notification: InAppNotification
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  onNotificationShown?: (notificationId: string) => void
}

/**
 * Wrapper component that renders the BackupReminderModal within the notification service.
 *
 * This component:
 * 1. Reports when the modal is shown (for telemetry)
 * 2. Reports when the modal is dismissed (for tracking)
 * 3. Preserves the existing modal UI exactly (no visual changes)
 *
 * The BackupReminderModal handles its own internal state and Redux updates.
 * This wrapper just handles the notification service integration.
 */
export function BackupReminderModalRenderer({
  notification,
  onNotificationClick,
  onNotificationShown,
}: BackupReminderModalRendererProps): JSX.Element {
  // Report when the modal is shown
  useEffect(() => {
    onNotificationShown?.(notification.id)
  }, [notification.id, onNotificationShown])

  const handleClose = (): void => {
    // Report to notification service that user dismissed the modal
    // The BackupReminderModal internally handles analytics and Redux updates
    onNotificationClick?.(notification.id, { type: 'dismiss' })
  }

  return <BackupReminderModal onClose={handleClose} />
}
