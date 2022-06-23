import React, { ReactElement, useCallback, useEffect } from 'react'
import {
  Directions,
  FlingGestureHandler,
  FlingGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler'
import { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { AnimatedBox, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { popNotification } from 'src/features/notifications/notificationSlice'
import { selectActiveAccountNotifications } from 'src/features/notifications/selectors'
import { useTimeout } from 'src/utils/timing'

const NOTIFICATION_HEIGHT = 72
const NOTIFICATION_ICON_SIZE = 36
export const NOTIFICATION_SIZING = {
  primaryImage: NOTIFICATION_ICON_SIZE * (2 / 3),
  secondaryImage: NOTIFICATION_ICON_SIZE * (2 / 3) * (2 / 3),
}

const DEFAULT_HIDE_DELAY = 5000 // 5 seconds
const HIDE_OFFSET_Y = -150
const SPRING_ANIMATION = { damping: 30, stiffness: 150 }

export interface NotificationContentProps {
  title: string
  icon?: ReactElement
  balanceUpdate?: {
    assetIncrease: string
    usdIncrease: string | undefined
  }
  actionButton?: {
    title: string
    onPress: () => void
  }
}

export interface NotificationToastProps extends NotificationContentProps {
  onPress?: () => void
  hideDelay?: number // If omitted, the default delay time is used
  address?: string
}

export function NotificationToast({
  title,
  icon,
  balanceUpdate,
  onPress,
  hideDelay,
  actionButton,
  address,
}: NotificationToastProps) {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(selectActiveAccountNotifications)
  const currentNotification = notifications[0]

  const showOffset = useSafeAreaInsets().top
  const bannerOffset = useSharedValue(HIDE_OFFSET_Y)

  useEffect(() => {
    if (currentNotification) {
      bannerOffset.value = withDelay(500, withSpring(showOffset, SPRING_ANIMATION))
    }
  }, [showOffset, bannerOffset, currentNotification])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerOffset.value }],
  }))

  const dismissLatest = useCallback(() => {
    bannerOffset.value = withSpring(HIDE_OFFSET_Y, SPRING_ANIMATION)
    setTimeout(() => dispatch(popNotification({ address })), 500)
    if (notifications.length > 1) {
      bannerOffset.value = withDelay(500, withSpring(showOffset, SPRING_ANIMATION))
    }
  }, [dispatch, bannerOffset, notifications, showOffset, address])

  const delay = hideDelay ?? DEFAULT_HIDE_DELAY
  const cancelDismiss = useTimeout(dismissLatest, delay)

  const onFling = ({ nativeEvent }: FlingGestureHandlerGestureEvent) => {
    if (nativeEvent.state === State.ACTIVE) {
      cancelDismiss?.()
      dismissLatest()
    }
  }

  const onNotificationPress = () => {
    cancelDismiss?.()
    if (onPress) {
      dispatch(popNotification({ address }))
      onPress()
    } else {
      dismissLatest()
    }
  }

  const onActionButtonPress = () => {
    cancelDismiss?.()
    dismissLatest()
    actionButton?.onPress()
  }

  return (
    <FlingGestureHandler direction={Directions.UP} onHandlerStateChange={onFling}>
      <AnimatedBox
        borderColor="backgroundContainer"
        borderRadius="lg"
        borderWidth={1}
        left={0}
        marginHorizontal="md"
        position="absolute"
        right={0}
        style={animatedStyle}
        zIndex="modal">
        <Button
          alignItems="center"
          bg="backgroundBackdrop"
          borderRadius="lg"
          flex={1}
          flexDirection="row"
          minHeight={NOTIFICATION_HEIGHT}
          px="md"
          py="md"
          onPress={onNotificationPress}>
          <NotificationContent
            actionButton={
              actionButton ? { title: actionButton.title, onPress: onActionButtonPress } : undefined
            }
            balanceUpdate={balanceUpdate}
            icon={icon}
            title={title}
          />
        </Button>
      </AnimatedBox>
    </FlingGestureHandler>
  )
}

export function NotificationContent({
  title,
  icon,
  balanceUpdate,
  actionButton,
}: NotificationContentProps) {
  const endAdornment = balanceUpdate || actionButton
  return (
    <Flex row alignItems="center" gap="xs" justifyContent="space-between" width="100%">
      <Flex
        row
        shrink
        alignItems="center"
        flexBasis={endAdornment ? '75%' : '100%'}
        gap="xs"
        justifyContent="flex-start">
        {icon && (
          <Flex centered height={NOTIFICATION_ICON_SIZE} width={NOTIFICATION_ICON_SIZE}>
            {icon}
          </Flex>
        )}
        <Flex row shrink alignItems="center">
          <Text adjustsFontSizeToFit fontWeight="500" numberOfLines={2} variant="body2">
            {title}
          </Text>
        </Flex>
      </Flex>
      {endAdornment ? (
        <Flex shrink alignItems="flex-end" flexBasis="25%" gap="xxs">
          {balanceUpdate ? (
            <>
              <Text
                adjustsFontSizeToFit
                color="accentSuccess"
                fontWeight="600"
                numberOfLines={1}
                variant="smallLabel">
                {balanceUpdate.assetIncrease}
              </Text>
              <Text
                adjustsFontSizeToFit
                color="textSecondary"
                fontWeight="500"
                numberOfLines={1}
                variant="code">
                {balanceUpdate.usdIncrease}
              </Text>
            </>
          ) : actionButton ? (
            <TextButton px="xs" py="xs" textColor="accentActive" onPress={actionButton.onPress}>
              {actionButton.title}
            </TextButton>
          ) : null}
        </Flex>
      ) : null}
    </Flex>
  )
}
