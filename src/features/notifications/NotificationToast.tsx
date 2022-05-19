import React, { ReactElement, useCallback, useEffect } from 'react'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { AnimatedBox, Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { popNotification } from 'src/features/notifications/notificationSlice'
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
}: NotificationToastProps) {
  const dispatch = useAppDispatch()
  const notificationQueue = useAppSelector((state) => state.notifications.notificationQueue)
  const currentNotification = notificationQueue[0]

  const showOffset = useSafeAreaInsets().top
  const bannerOffset = useSharedValue(HIDE_OFFSET_Y)

  useEffect(() => {
    if (currentNotification) {
      bannerOffset.value = withSpring(showOffset, SPRING_ANIMATION)
    }
  }, [showOffset, bannerOffset, currentNotification])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerOffset.value }],
  }))

  const dismissLatest = useCallback(() => {
    bannerOffset.value = withSpring(HIDE_OFFSET_Y, SPRING_ANIMATION)
    setTimeout(() => dispatch(popNotification()), 500)
    if (notificationQueue.length > 1) {
      setTimeout(() => (bannerOffset.value = withSpring(showOffset, SPRING_ANIMATION)), 500)
    }
  }, [dispatch, bannerOffset, notificationQueue, showOffset])

  const delay = hideDelay ?? DEFAULT_HIDE_DELAY
  const cancelDismiss = useTimeout(dismissLatest, delay)

  const onNotificationPress = () => {
    cancelDismiss?.()
    if (onPress) {
      dispatch(popNotification())
      onPress()
    } else {
      dismissLatest()
    }
  }

  return (
    <AnimatedBox
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
        <NotificationContent balanceUpdate={balanceUpdate} icon={icon} title={title} />
      </Button>
    </AnimatedBox>
  )
}

export function NotificationContent({ title, icon, balanceUpdate }: NotificationContentProps) {
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
    </Flex>
  )
}
