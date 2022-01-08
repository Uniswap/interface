import React, { PropsWithChildren, useCallback, useEffect } from 'react'
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import AlertCircle from 'src/assets/icons/alert-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { AnimatedBox } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { popNotification } from 'src/features/notifications/notificationSlice'
import { AppNotification, NotificationSeverity } from 'src/features/notifications/types'
import { useTimeout } from 'src/utils/timing'

const DEFAULT_HIDE_DELAY = 5000 // 5 seconds

// TODO No z-index value or other hackery can cause this to render over the sheet screens
// which seem to have some native-layer magic forcing them above.
export function NotificationBannerWrapper({ children }: PropsWithChildren<any>) {
  const dispatch = useAppDispatch()
  const notificationQueue = useAppSelector((state) => state.notifications.notificationQueue)
  const firstNotification = notificationQueue.length ? notificationQueue[0] : null

  const bannerHeight = useSharedValue(0)
  useEffect(() => {
    if (firstNotification) {
      bannerHeight.value = withTiming(110, { duration: 750 })
    }
  }, [bannerHeight, firstNotification])
  const style = useAnimatedStyle(() => ({
    height: bannerHeight.value,
  }))

  const dismissLatest = useCallback(() => {
    if (notificationQueue.length === 1) {
      bannerHeight.value = withTiming(0, { duration: 300 })
      // Note: Tried to use the withTiming callback with `runOnJs(pop)` but
      // blocked by mysterious bug that only occurs on Hermes:
      // https://github.com/software-mansion/react-native-reanimated/issues/1758#issuecomment-1007938652
      setTimeout(() => dispatch(popNotification()), 300)
    } else if (notificationQueue.length > 1) {
      dispatch(popNotification())
    }
  }, [dispatch, notificationQueue, bannerHeight])

  const delay = firstNotification?.hideDelay ?? DEFAULT_HIDE_DELAY
  const cancelDismiss = useTimeout(dismissLatest, delay)

  const onPressNotification = () => {
    cancelDismiss?.()
    dismissLatest()
  }

  return (
    <>
      {firstNotification && (
        <AnimatedBox position="absolute" top={0} left={0} right={0} zIndex="modal" style={style}>
          <NotificationBanner appNotification={firstNotification} onPress={onPressNotification} />
        </AnimatedBox>
      )}
      {children}
    </>
  )
}

function NotificationBanner({
  appNotification,
  onPress,
}: {
  appNotification: AppNotification
  onPress: () => void
}) {
  const { message, severity = NotificationSeverity.info } = appNotification
  return (
    <Button
      onPress={onPress}
      flex={1}
      flexDirection="row"
      alignItems="center"
      pt="xl"
      px="lg"
      bg={getNotificationColor(severity)}>
      <AlertCircle width={24} height={24} />
      <Text variant="bodySm" fontWeight="500" ml="md">
        {message}
      </Text>
    </Button>
  )
}

function getNotificationColor(severity: NotificationSeverity) {
  switch (severity) {
    case NotificationSeverity.error:
      return 'error'
    case NotificationSeverity.warning:
      return 'warning'
    default:
      return 'blue'
  }
}
