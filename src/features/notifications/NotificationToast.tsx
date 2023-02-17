import React, { useCallback, useEffect } from 'react'
import {
  Directions,
  FlingGestureHandler,
  FlingGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler'
import { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedBox, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { popNotification } from 'src/features/notifications/notificationSlice'
import { selectActiveAccountNotifications } from 'src/features/notifications/selectors'
import { useTimeout } from 'src/utils/timing'

const NOTIFICATION_HEIGHT = 64

const DEFAULT_HIDE_DELAY = 5000 // 5 seconds
const HIDE_OFFSET_Y = -150
const SPRING_ANIMATION = { damping: 30, stiffness: 150 }

export interface NotificationContentProps {
  title: string
  icon?: JSX.Element
  balanceUpdate?: JSX.Element
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
  useSmallDisplay?: boolean // for compressed toasts with only icon and text
}

export function NotificationToast({
  title,
  icon,
  balanceUpdate,
  onPress,
  onPressIn,
  hideDelay,
  actionButton,
  address,
  useSmallDisplay,
}: NotificationToastProps): JSX.Element {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(selectActiveAccountNotifications)
  const currentNotification = notifications[0]
  const hasQueuedNotification = !!notifications[1]

  const showOffset = useSafeAreaInsets().top
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
    if (notifications.length > 1) {
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
      <AnimatedBox
        borderColor={useSmallDisplay ? 'none' : 'background3'}
        borderRadius="rounded16"
        borderWidth={1}
        left={0}
        marginHorizontal="spacing16"
        pointerEvents="box-none"
        position="absolute"
        right={0}
        style={animatedStyle}
        zIndex="modal">
        {useSmallDisplay ? (
          <NotificationContentSmall
            icon={icon}
            title={title}
            onPress={onNotificationPress}
            onPressIn={onPressIn}
          />
        ) : (
          <NotificationContent
            actionButton={
              actionButton ? { title: actionButton.title, onPress: onActionButtonPress } : undefined
            }
            balanceUpdate={balanceUpdate}
            icon={icon}
            title={title}
            onPress={onNotificationPress}
            onPressIn={onPressIn}
          />
        )}
      </AnimatedBox>
    </FlingGestureHandler>
  )
}

export function NotificationContent({
  title,
  icon,
  balanceUpdate,
  actionButton,
  onPress,
  onPressIn,
}: NotificationContentProps): JSX.Element {
  const endAdornment = balanceUpdate || actionButton
  return (
    <TouchableArea
      alignItems="center"
      bg="background1"
      borderRadius="rounded16"
      flex={1}
      flexDirection="row"
      minHeight={NOTIFICATION_HEIGHT}
      px="spacing16"
      py="spacing16"
      onPress={onPress}
      onPressIn={onPressIn}>
      <Flex row alignItems="center" gap="spacing8" justifyContent="space-between" width="100%">
        <Flex
          row
          shrink
          alignItems="center"
          flexBasis={endAdornment ? '75%' : '100%'}
          gap="spacing8"
          justifyContent="flex-start">
          {icon}
          <Flex row shrink alignItems="center">
            <Text numberOfLines={2} variant="bodySmall">
              {title}
            </Text>
          </Flex>
        </Flex>
        {endAdornment ? (
          <Flex shrink alignItems="flex-end" flexBasis="25%" gap="spacing4">
            {balanceUpdate ? (
              balanceUpdate
            ) : actionButton ? (
              <TouchableArea p="spacing8" onPress={actionButton.onPress}>
                <Text color="accentActive">{actionButton.title}</Text>
              </TouchableArea>
            ) : null}
          </Flex>
        ) : null}
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
    <Flex row flexShrink={1} justifyContent="center" pointerEvents="box-none">
      <TouchableArea
        bg="background1"
        borderColor="background3"
        borderRadius="roundedFull"
        borderWidth={1}
        p="spacing12"
        onPress={onPress}
        onPressIn={onPressIn}>
        <Flex row alignItems="center" gap="spacing8" justifyContent="flex-start" pr="spacing4">
          {icon}
          <Text adjustsFontSizeToFit numberOfLines={1} variant="bodyLarge">
            {title}
          </Text>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
