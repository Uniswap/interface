import { useCallback, useMemo } from 'react'
import { Directions, FlingGestureHandler, FlingGestureHandlerGestureEvent, State } from 'react-native-gesture-handler'
import { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { spacing } from 'ui/src/theme'
import { NotificationToastProps } from 'uniswap/src/components/notifications/NotificationToast'
import { NotificationToastContent } from 'uniswap/src/components/notifications/NotificationToastContent'
import {
  HIDE_OFFSET_Y,
  LARGE_TOAST_RADIUS,
  SPRING_ANIMATION,
  SPRING_ANIMATION_DELAY,
} from 'uniswap/src/features/notifications/constants'
import { useNotificationLifecycle } from 'uniswap/src/features/notifications/hooks/useNotificationLifecycle'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

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
  const showOffset = useAppInsets().top + spacing.spacing4
  const bannerOffset = useSharedValue(HIDE_OFFSET_Y)

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: bannerOffset.value }],
    }),
    [bannerOffset],
  )

  const onDismissLatest = useCallback(() => {
    bannerOffset.value = withSpring(HIDE_OFFSET_Y, SPRING_ANIMATION)
  }, [])

  const onShowCurrentNotification = useCallback(() => {
    bannerOffset.value = withDelay(SPRING_ANIMATION_DELAY, withSpring(showOffset, SPRING_ANIMATION))
  }, [showOffset])

  const { onActionButtonPress, onNotificationPress, cancelDismiss, dismissLatest } = useNotificationLifecycle({
    actionButtonOnPress: actionButton?.onPress,
    address,
    hideDelay,
    onPress,
    onDismissLatest,
    onShowCurrentNotification,
  })

  const onFling = ({ nativeEvent }: FlingGestureHandlerGestureEvent): void => {
    if (nativeEvent.state === State.ACTIVE) {
      cancelDismiss()
      dismissLatest()
    }
  }

  const notificationContent = useMemo(
    () => (
      <NotificationToastContent
        title={title}
        subtitle={subtitle}
        icon={icon}
        postCaptionElement={postCaptionElement}
        contentOverride={contentOverride}
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
      contentOverride,
      smallToast,
      actionButton,
      onPressIn,
      onNotificationPress,
      onActionButtonPress,
    ],
  )

  return (
    <FlingGestureHandler direction={Directions.UP} onHandlerStateChange={onFling}>
      <AnimatedFlex
        centered
        borderRadius={LARGE_TOAST_RADIUS}
        pointerEvents="box-none"
        position="absolute"
        style={animatedStyle}
        top={0}
        width="100%"
        zIndex="$modal"
      >
        {notificationContent}
      </AnimatedFlex>
    </FlingGestureHandler>
  )
}
