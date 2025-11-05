/* eslint-disable import/no-unused-modules */
import { type InAppNotification } from '@universe/api'
import { type NotificationState, useNotificationStore } from 'notification-renderer/notificationStore'
import { memo, useCallback } from 'react'
import { Flex, Portal, Text } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { type StoreApi, type UseBoundStore } from 'zustand'

interface NotificationItemProps {
  notification: InAppNotification
  onDismiss: (notificationId: string) => void
}

/**
 * Renders a single notification item
 * TODO: delete this component once we have real UI built.
 */
const NotificationItem = memo(function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const handleDismiss = useCallback(() => {
    onDismiss(notification.id)
  }, [notification.id, onDismiss])

  // TODO: Map notification types to real UI components
  // For now, render a placeholder card with notification content
  return (
    <Flex
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      padding="$spacing16"
      pointerEvents="auto"
      minWidth={320}
      shadowColor="$neutral3"
      shadowOpacity={0.1}
      shadowRadius={8}
      shadowOffset={{ width: 0, height: 4 }}
    >
      <Text variant="subheading2" color="$neutral1">
        {notification.content.title}
      </Text>
      {notification.content.subtitle && (
        <Text variant="body3" color="$neutral2" marginTop="$spacing4">
          {notification.content.subtitle}
        </Text>
      )}
      {/* TODO: Render buttons if present */}
      {notification.content.buttons && notification.content.buttons.length > 0 && (
        <Flex row gap="$spacing8" marginTop="$spacing12">
          {notification.content.buttons.map((button, index) => (
            <Flex key={index} cursor="pointer" onPress={handleDismiss} pressStyle={{ opacity: 0.7 }}>
              <Text variant="buttonLabel3" color="$accent1">
                {button.text}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  )
})

/**
 * Renders a banner-style notification in the lower-left corner
 * TODO: this should only handle placement. Replace the NotificationItem with the actual banner UI component.
 */
const BannerNotification = memo(function BannerNotification({
  notification,
  onDismiss,
}: {
  notification: InAppNotification
  onDismiss: (id: string) => void
}) {
  return (
    <Portal>
      <Flex
        $platform-web={{
          position: 'fixed',
          bottom: 100,
          left: '$spacing24',
          pointerEvents: 'none',
        }}
        zIndex={9999}
        maxWidth={400}
        onPress={() => onDismiss(notification.id)}
      >
        <NotificationItem notification={notification} onDismiss={onDismiss} />
      </Flex>
    </Portal>
  )
})

/**
 * Renders a modal-style notification centered with overlay
 * TODO: Replace with actual modal component
 */
const ModalNotification = memo(function ModalNotification({
  notification,
  onDismiss,
}: {
  notification: InAppNotification
  onDismiss: (id: string) => void
}) {
  return (
    <Portal>
      <Flex
        $platform-web={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'auto',
        }}
        zIndex={10000}
        alignItems="center"
        justifyContent="center"
        backgroundColor="rgba(0, 0, 0, 0.4)"
        onPress={() => onDismiss(notification.id)}
      >
        <NotificationItem notification={notification} onDismiss={onDismiss} />
      </Flex>
    </Portal>
  )
})

/**
 * Routes a notification to the appropriate renderer based on its style
 */
function NotificationRenderer({
  notification,
  onDismiss,
}: {
  notification: InAppNotification
  onDismiss: (id: string) => void
}) {
  const style = notification.content.style

  switch (style) {
    case 'CONTENT_STYLE_LOWER_LEFT_BANNER':
      return <BannerNotification notification={notification} onDismiss={onDismiss} />
    case 'CONTENT_STYLE_MODAL':
      return <ModalNotification notification={notification} onDismiss={onDismiss} />
    default:
      logger.warn('NotificationContainer', 'renderNotification', `Unknown notification style: ${style}`, {
        notification,
      })
      return null
  }
}

/**
 * NotificationContainer component
 * Subscribes to the notification store and renders active notifications
 * Should be mounted at the app root level
 */
export function NotificationContainer({
  onDismiss,
  store = useNotificationStore,
}: {
  onDismiss?: (notificationId: string) => void
  store?: UseBoundStore<StoreApi<NotificationState>>
}) {
  const activeNotifications = store((state) => state.activeNotifications)
  const removeNotification = store((state) => state.removeNotification)

  const handleDismiss = useCallback(
    (notificationId: string) => {
      removeNotification(notificationId)
      onDismiss?.(notificationId)
    },
    [removeNotification, onDismiss],
  )

  return (
    <>
      {activeNotifications.map((notification) => (
        <NotificationRenderer key={notification.id} notification={notification} onDismiss={handleDismiss} />
      ))}
    </>
  )
}
