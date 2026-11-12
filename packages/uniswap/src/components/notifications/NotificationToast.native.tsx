import { spacing, AnimatedFlex } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useCallback, useMemo, useState } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import type { NotificationToastProps } from 'uniswap/src/components/notifications/NotificationToast'
import { NotificationToastContent } from 'uniswap/src/components/notifications/NotificationToastContent'
import {
  HIDE_OFFSET_Y,
  LARGE_TOAST_RADIUS,
  SPRING_ANIMATION,
  SPRING_ANIMATION_DELAY,
  SWIPE_DISMISS_ACTIVATION_OFFSET,
  SWIPE_DISMISS_DISTANCE,
  SWIPE_DISMISS_VELOCITY,
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
  onExplicitDismiss,
}: NotificationToastProps): JSX.Element {
  const showOffset = useAppInsets().top + spacing.spacing4
  const bannerOffset = useSharedValue(HIDE_OFFSET_Y)
  const swipeOffset = useSharedValue(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: bannerOffset.value + swipeOffset.value }],
    }),
    [bannerOffset, swipeOffset],
  )

  const onDismissLatest = useCallback(() => {
    bannerOffset.value = withSpring(HIDE_OFFSET_Y, SPRING_ANIMATION)
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [])

  const onShowCurrentNotification = useCallback(() => {
    swipeOffset.value = 0
    setIsSwiping(false)
    bannerOffset.value = withDelay(SPRING_ANIMATION_DELAY, withSpring(showOffset, SPRING_ANIMATION))
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [showOffset])

  const { onActionButtonPress, onNotificationPress, cancelDismiss, dismissLatest } = useNotificationLifecycle({
    actionButtonOnPress: actionButton?.onPress,
    address,
    hideDelay,
    isDismissPaused: isSwiping,
    onPress,
    onDismissLatest,
    onShowCurrentNotification,
  })
  const resolvedContentOverride = useMemo(
    () => (typeof contentOverride === 'function' ? contentOverride({ cancelDismiss, dismissLatest }) : contentOverride),
    [cancelDismiss, contentOverride, dismissLatest],
  )

  const onSwipeDismiss = useCallback(() => {
    cancelDismiss()
    onExplicitDismiss?.()
    dismissLatest()
  }, [cancelDismiss, onExplicitDismiss, dismissLatest])

  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .withTestId(TestID.NotificationToastSwipe)
        .activeOffsetY(-SWIPE_DISMISS_ACTIVATION_OFFSET)
        .onStart(() => {
          scheduleOnRN(setIsSwiping, true)
        })
        .onUpdate(({ translationY }) => {
          swipeOffset.value = Math.min(translationY, 0)
        })
        .onEnd(({ velocityY }) => {
          if (swipeOffset.value < -SWIPE_DISMISS_DISTANCE || velocityY < -SWIPE_DISMISS_VELOCITY) {
            scheduleOnRN(onSwipeDismiss)
          } else {
            swipeOffset.value = withSpring(0, SPRING_ANIMATION)
            scheduleOnRN(setIsSwiping, false)
          }
        }),
    [onSwipeDismiss, swipeOffset],
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

  return (
    <GestureDetector gesture={swipeGesture}>
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
    </GestureDetector>
  )
}
