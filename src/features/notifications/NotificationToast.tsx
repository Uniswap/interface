import React, { PropsWithChildren, useCallback, useEffect } from 'react'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { popNotification } from 'src/features/notifications/notificationSlice'
import { AppNotification, AppNotificationType } from 'src/features/notifications/types'
import { flex } from 'src/styles/flex'
import { toSupportedChainId } from 'src/utils/chainId'
import { useTimeout } from 'src/utils/timing'

const DEFAULT_HIDE_DELAY = 5000 // 5 seconds
const HIDE_OFFSET_Y = -150
const SPRING_ANIMATION = { damping: 30, stiffness: 150 }

// TODO No z-index value or other hackery can cause this to render over the sheet screens
// which seem to have some native-layer magic forcing them above.
export function NotificationToastWrapper({ children }: PropsWithChildren<any>) {
  const dispatch = useAppDispatch()
  const notificationQueue = useAppSelector((state) => state.notifications.notificationQueue)
  const firstNotification = notificationQueue.length ? notificationQueue[0] : null

  const showOffset = useSafeAreaInsets().top
  const bannerOffset = useSharedValue(HIDE_OFFSET_Y)

  useEffect(() => {
    if (firstNotification) {
      bannerOffset.value = withSpring(showOffset, SPRING_ANIMATION)
    }
  }, [showOffset, bannerOffset, firstNotification])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerOffset.value }],
  }))

  const dismissLatest = useCallback(() => {
    if (notificationQueue.length === 1) {
      bannerOffset.value = withSpring(HIDE_OFFSET_Y, SPRING_ANIMATION)
      setTimeout(() => dispatch(popNotification()), 500)
    } else if (notificationQueue.length > 1) {
      dispatch(popNotification())
    }
  }, [dispatch, notificationQueue, bannerOffset])

  const delay = firstNotification?.hideDelay ?? DEFAULT_HIDE_DELAY
  const cancelDismiss = useTimeout(dismissLatest, delay)

  const onPressNotification = () => {
    cancelDismiss?.()
    dismissLatest()
    // TODO: Handle navigating to relevant screen if needed
  }

  return (
    <>
      {firstNotification && (
        <AnimatedBox
          left={0}
          marginHorizontal="md"
          position="absolute"
          right={0}
          style={animatedStyle}
          zIndex="modal">
          <NotificationToast appNotification={firstNotification} onPress={onPressNotification} />
        </AnimatedBox>
      )}
      {children}
    </>
  )
}

function NotificationButton({ children, onPress }: PropsWithChildren<{ onPress: () => void }>) {
  return (
    <Button
      alignItems="center"
      bg="mainBackground"
      borderColor="secondary1"
      borderRadius="lg"
      borderWidth={1}
      flexDirection="row"
      px="lg"
      py="md"
      onPress={onPress}>
      {children}
    </Button>
  )
}

export function NotificationToast({
  appNotification,
  onPress,
}: {
  appNotification: AppNotification
  onPress: () => void
}) {
  const { title } = appNotification

  if (appNotification.type === AppNotificationType.WalletConnect) {
    const { imageUrl, chainId: chainIdString } = appNotification
    const chainId = toSupportedChainId(chainIdString)

    return (
      <NotificationButton onPress={onPress}>
        <Flex row alignItems="center" gap="md">
          <Box alignItems="center" justifyContent="center">
            <RemoteImage borderRadius={15} height={30} imageUrl={imageUrl} width={30} />
            {chainId && (
              <Box bottom={-5} position="absolute" right={-5}>
                <NetworkLogo chainId={chainId} size={15} />
              </Box>
            )}
          </Box>
          <Flex row shrink gap="xs">
            <Text fontWeight="500" style={flex.shrink} variant="bodyMd">
              {title}
            </Text>
          </Flex>
        </Flex>
      </NotificationButton>
    )
  }

  return (
    <NotificationButton onPress={onPress}>
      <Flex row alignItems="center" gap="md">
        <Flex shrink gap="xs">
          <Text fontWeight="500" style={flex.shrink} variant="bodyMd">
            {title}
          </Text>
        </Flex>
      </Flex>
    </NotificationButton>
  )
}
