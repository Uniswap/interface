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
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { popNotification } from 'src/features/notifications/notificationSlice'
import { selectActiveAccountNotifications } from 'src/features/notifications/selectors'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { flex } from 'src/styles/flex'
import { useTimeout } from 'src/utils/timing'

const NOTIFICATION_HEIGHT = 72
const NOTIFICATION_ICON_SIZE = 36
export const NOTIFICATION_SIZING = {
  primaryImage: NOTIFICATION_ICON_SIZE * (2 / 3),
  secondaryImage: NOTIFICATION_ICON_SIZE * (2 / 3) * (2 / 3),
}

const DEFAULT_HIDE_DELAY = 3000 // 3 seconds
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
}

export function NotificationToast({
  title,
  icon,
  balanceUpdate,
  onPress,
  hideDelay,
  actionButton,
}: NotificationToastProps) {
  const dispatch = useAppDispatch()
  const activeAddress = useAppSelector(selectActiveAccountAddress)
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
    setTimeout(() => dispatch(popNotification({ address: activeAddress })), 500)
    if (notifications.length > 1) {
      bannerOffset.value = withDelay(500, withSpring(showOffset, SPRING_ANIMATION))
    }
  }, [dispatch, bannerOffset, notifications, showOffset, activeAddress])

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
      dispatch(popNotification({ address: activeAddress }))
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
        borderColor="neutralContainer"
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
          bg="neutralBackground"
          borderRadius="lg"
          flex={1}
          flexDirection="row"
          height={NOTIFICATION_HEIGHT}
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
  return (
    <Flex centered row gap="sm">
      {icon && (
        <Box
          alignItems="center"
          height={NOTIFICATION_ICON_SIZE}
          justifyContent="center"
          width={NOTIFICATION_ICON_SIZE}>
          {icon}
        </Box>
      )}
      <Flex shrink>
        <Text fontWeight="500" style={flex.shrink} variant="body2">
          {title}
        </Text>
      </Flex>
      {balanceUpdate && (
        <Flex alignItems="flex-end" gap="xxs">
          <Text
            color="accentBackgroundSuccess"
            fontWeight="600"
            style={flex.shrink}
            variant="body1">
            {balanceUpdate.assetIncrease}
          </Text>
          <Text
            color="neutralTextSecondary"
            fontWeight="500"
            style={flex.shrink}
            variant="smallLabel">
            {balanceUpdate.usdIncrease}
          </Text>
        </Flex>
      )}
      {actionButton && !balanceUpdate && (
        <Flex alignItems="flex-end" gap="xxs">
          <TextButton
            px="xs"
            py="xs"
            textColor="accentBackgroundActive"
            onPress={actionButton.onPress}>
            {actionButton.title}
          </TextButton>
        </Flex>
      )}
    </Flex>
  )
}
