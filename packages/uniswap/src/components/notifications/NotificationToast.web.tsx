import { useMemo } from 'react'
import { Flex, styled } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import type { NotificationToastProps } from 'uniswap/src/components/notifications/NotificationToast'
import { NotificationToastContent } from 'uniswap/src/components/notifications/NotificationToastContent'
import { HIDE_OFFSET_Y } from 'uniswap/src/features/notifications/constants'
import { useNotificationLifecycle } from 'uniswap/src/features/notifications/hooks/useNotificationLifecycle'

// TODO(EXT-931): Consolidate mobile and web animation styles
const WebToastEntryAnimation = styled(Flex, {
  animation: 'semiBouncy',
  y: 0,
  top: '$spacing12',
  left: '$spacing12',
  right: '$spacing12',
  '$platform-web': {
    position: 'fixed',
  },
  zIndex: zIndexes.toast,
  opacity: 1,
  pointerEvents: 'none',
  enterStyle: {
    y: HIDE_OFFSET_Y,
    opacity: 0,
  },
})

export function NotificationToast({
  subtitle,
  title,
  icon,
  postCaptionElement,
  onPress,
  onPressIn,
  hideDelay,
  actionButton,
  address,
  smallToast,
  contentOverride,
}: NotificationToastProps): JSX.Element {
  const { onActionButtonPress, onNotificationPress, cancelDismiss, dismissLatest } = useNotificationLifecycle({
    actionButtonOnPress: actionButton?.onPress,
    address,
    hideDelay,
    onPress,
  })
  const resolvedContentOverride = useMemo(
    () => (typeof contentOverride === 'function' ? contentOverride({ cancelDismiss, dismissLatest }) : contentOverride),
    [cancelDismiss, contentOverride, dismissLatest],
  )

  const notificationContent = useMemo(
    () => (
      <NotificationToastContent
        title={title}
        subtitle={subtitle}
        icon={icon}
        postCaptionElement={postCaptionElement}
        contentOverride={resolvedContentOverride}
        smallToast={smallToast}
        actionButton={actionButton}
        onPressIn={onPressIn}
        onNotificationPress={onNotificationPress}
        onActionButtonPress={onActionButtonPress}
      />
    ),
    [
      title,
      subtitle,
      icon,
      postCaptionElement,
      resolvedContentOverride,
      smallToast,
      actionButton,
      onPressIn,
      onNotificationPress,
      onActionButtonPress,
    ],
  )

  return <WebToastEntryAnimation>{notificationContent}</WebToastEntryAnimation>
}
