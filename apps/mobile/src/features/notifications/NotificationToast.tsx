import React, { useCallback, useEffect } from 'react'
import {
  Directions,
  FlingGestureHandler,
  FlingGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler'
import { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { selectActiveAccountNotifications } from 'src/features/notifications/selectors'
import { AnimatedFlex, Flex, mediumShadowProps, Text, TouchableArea, useDeviceInsets } from 'ui/src'
import { borderRadii, spacing } from 'ui/src/theme'
import { useTimeout } from 'utilities/src/time/timing'
import { popNotification } from 'wallet/src/features/notifications/slice'

const NOTIFICATION_HEIGHT = 64

const DEFAULT_HIDE_DELAY = 5000 // 5 seconds
const HIDE_OFFSET_Y = -150
const SPRING_ANIMATION = { damping: 30, stiffness: 150 }

const TOAST_BORDER_WIDTH = spacing.spacing2
const LARGE_TOAST_RADIUS = borderRadii.rounded24
const SMALL_TOAST_RADIUS = borderRadii.roundedFull

export interface NotificationContentProps {
  title: string
  icon?: JSX.Element
  actionButton?: {
    title: string
    onPress: () => void
  }
  onPress?: () => void
  onPressIn?: () => void
}

export interface NotificationToastProps extends NotificationContentProps {
  hideDelay?: number // If omitted, the default delay time is used
  address?: string
  smallToast?: boolean // for compressed toasts with only icon and text
}

export function NotificationToast({
  title,
  icon,
  onPress,
  onPressIn,
  hideDelay,
  actionButton,
  address,
  smallToast,
}: NotificationToastProps): JSX.Element {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(selectActiveAccountNotifications)
  const currentNotification = notifications?.[0]
  const hasQueuedNotification = !!notifications?.[1]

  const showOffset = useDeviceInsets().top + spacing.spacing4
  const bannerOffset = useSharedValue(HIDE_OFFSET_Y)

  useEffect(() => {
    if (currentNotification) {
      bannerOffset.value = withDelay(100, withSpring(showOffset, SPRING_ANIMATION))
    }
  }, [showOffset, bannerOffset, currentNotification])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerOffset.value }],
  }))

  const dismissLatest = useCallback(() => {
    bannerOffset.value = withSpring(HIDE_OFFSET_Y, SPRING_ANIMATION)
    setTimeout(() => dispatch(popNotification({ address })), 500)
    if (notifications && notifications.length > 1) {
      bannerOffset.value = withDelay(100, withSpring(showOffset, SPRING_ANIMATION))
    }
  }, [address, bannerOffset, dispatch, notifications, showOffset])

  // If there is another notification in the queue then hide the current one immediately
  const delay = hasQueuedNotification ? 0 : hideDelay ?? DEFAULT_HIDE_DELAY
  const cancelDismiss = useTimeout(dismissLatest, delay)

  const onFling = ({ nativeEvent }: FlingGestureHandlerGestureEvent): void => {
    if (nativeEvent.state === State.ACTIVE) {
      cancelDismiss?.()
      dismissLatest()
    }
  }

  const onNotificationPress = (): void => {
    cancelDismiss?.()
    if (onPress) {
      dispatch(popNotification({ address }))
      onPress()
    } else {
      dismissLatest()
    }
  }

  const onActionButtonPress = (): void => {
    cancelDismiss?.()
    dismissLatest()
    actionButton?.onPress()
  }

  return (
    <FlingGestureHandler direction={Directions.UP} onHandlerStateChange={onFling}>
      <AnimatedFlex
        centered
        pointerEvents="box-none"
        position="absolute"
        style={animatedStyle}
        top={0}
        width="100%"
        zIndex="$modal">
        <Flex {...mediumShadowProps} mx={smallToast ? 'auto' : '$spacing24'}>
          {smallToast ? (
            <NotificationContentSmall
              icon={icon}
              title={title}
              onPress={onNotificationPress}
              onPressIn={onPressIn}
            />
          ) : (
            <NotificationContent
              actionButton={
                actionButton
                  ? { title: actionButton.title, onPress: onActionButtonPress }
                  : undefined
              }
              icon={icon}
              title={title}
              onPress={onNotificationPress}
              onPressIn={onPressIn}
            />
          )}
        </Flex>
      </AnimatedFlex>
    </FlingGestureHandler>
  )
}

export function NotificationContent({
  title,
  icon,
  actionButton,
  onPress,
  onPressIn,
}: NotificationContentProps): JSX.Element {
  return (
    <TouchableArea
      alignItems="center"
      bg="$surface2"
      borderColor="$surface3"
      borderRadius={LARGE_TOAST_RADIUS}
      borderWidth={TOAST_BORDER_WIDTH}
      flex={1}
      flexDirection="row"
      minHeight={NOTIFICATION_HEIGHT}
      px="$spacing16"
      py="$spacing16"
      onPress={onPress}
      onPressIn={onPressIn}>
      <Flex row alignItems="center" gap="$spacing8" justifyContent="space-between" width="100%">
        <Flex
          row
          shrink
          alignItems="center"
          flexBasis={actionButton ? '75%' : '100%'}
          gap="$spacing12"
          justifyContent="flex-start">
          {icon}
          <Flex row shrink alignItems="center">
            <Text adjustsFontSizeToFit numberOfLines={2} variant="body2">
              {title}
            </Text>
          </Flex>
        </Flex>
        {actionButton && (
          <Flex shrink alignItems="flex-end" flexBasis="25%" gap="$spacing4">
            <TouchableArea p="$spacing8" onPress={actionButton.onPress}>
              <Text adjustsFontSizeToFit color="$accent1" numberOfLines={1}>
                {actionButton.title}
              </Text>
            </TouchableArea>
          </Flex>
        )}
      </Flex>
    </TouchableArea>
  )
}

export function NotificationContentSmall({
  title,
  icon,
  onPress,
  onPressIn,
}: NotificationContentProps): JSX.Element {
  return (
    <Flex centered row shrink pointerEvents="box-none">
      <TouchableArea
        bg="$surface2"
        borderColor="$surface3"
        borderRadius={SMALL_TOAST_RADIUS}
        borderWidth={TOAST_BORDER_WIDTH}
        p="$spacing12"
        onPress={onPress}
        onPressIn={onPressIn}>
        <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-start" pr="$spacing4">
          <Flex>{icon}</Flex>
          <Text adjustsFontSizeToFit numberOfLines={1} variant="body1">
            {title}
          </Text>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
