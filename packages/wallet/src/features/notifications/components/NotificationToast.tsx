//! tamagui-ignore
// TODO(EXT-732): there's some sort of encoding bug that just popped up here in
// the tamagui optimizer disabling optimization for now on this file

import { useCallback, useEffect } from 'react'
import { Directions, FlingGestureHandler, FlingGestureHandlerGestureEvent, State } from 'react-native-gesture-handler'
import { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { ElementAfterText, Flex, Text, TouchableArea, isWeb, styled, useShadowPropsShort } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { borderRadii, spacing } from 'ui/src/theme'
import { useSelectAddressNotifications } from 'uniswap/src/features/notifications/hooks'
import { popNotification, setNotificationViewed } from 'uniswap/src/features/notifications/slice'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useTimeout } from 'utilities/src/time/timing'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const NOTIFICATION_HEIGHT = 64

const DEFAULT_HIDE_DELAY = 5000 // 5 seconds
const HIDE_OFFSET_Y = -150
const SPRING_ANIMATION = { damping: 30, stiffness: 150 }

const TOAST_BORDER_WIDTH = spacing.spacing1
const LARGE_TOAST_RADIUS = borderRadii.rounded24
const SMALL_TOAST_RADIUS = borderRadii.roundedFull

const MAX_TEXT_LENGTH = 20

export interface NotificationContentProps {
  title: string
  subtitle?: string
  icon?: JSX.Element
  postCaptionElement?: JSX.Element
  actionButton?: {
    title: string
    onPress: () => void
  }
  onPress?: () => void
  onPressIn?: () => void
  contentOverride?: JSX.Element
}

export interface NotificationToastProps extends NotificationContentProps {
  hideDelay?: number // If omitted, the default delay time is used
  address?: string
  smallToast?: boolean // for compressed toasts with only icon and text
}

// TODO(EXT-931): Consolidate mobile and web animation styles
const WebToastEntryAnimation = styled(Flex, {
  animation: 'semiBouncy',
  y: 0,
  top: '$spacing12',
  // @ts-expect-error - It's Ok to ignore and use the web-only `fixed` value because this component is only used on web.
  position: 'fixed',
  width: '100%',
  zIndex: '$overlay',
  opacity: 1,
  pointerEvents: 'none',

  enterStyle: {
    y: HIDE_OFFSET_Y,
    opacity: 0,
  },
})

const SPRING_ANIMATION_DELAY = 100

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
  const shadowProps = useShadowPropsShort()
  const dispatch = useDispatch()
  const activeAccountAddress = useActiveAccountAddress()
  const notifications = useSelectAddressNotifications(activeAccountAddress)
  const currentNotification = notifications?.[0]
  const hasQueuedNotification = !!notifications?.[1]

  const showOffset = useAppInsets().top + spacing.spacing4 + (isWeb ? spacing.spacing12 : 0)
  const bannerOffset = useSharedValue(HIDE_OFFSET_Y)

  // Run this only once to ensure that if a new notification is created it doesn't show on the next screen
  useEffect(() => {
    if (currentNotification?.shown) {
      dispatch(popNotification({ address }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, dispatch])

  useEffect(() => {
    if (currentNotification) {
      bannerOffset.value = withDelay(SPRING_ANIMATION_DELAY, withSpring(showOffset, SPRING_ANIMATION))
      // delay to ensure the notification is shown if theres a quick navigation event
      setTimeout(() => {
        dispatch(setNotificationViewed({ address }))
      }, SPRING_ANIMATION_DELAY * 2)
    }
  }, [showOffset, bannerOffset, currentNotification, dispatch, address])

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: bannerOffset.value }],
    }),
    [bannerOffset],
  )

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

  const notificationContent = (
    <Flex
      {...shadowProps}
      borderColor="$surface3"
      borderRadius={smallToast ? SMALL_TOAST_RADIUS : LARGE_TOAST_RADIUS}
      borderWidth={TOAST_BORDER_WIDTH}
      mx={smallToast ? 'auto' : '$spacing12'}
      pointerEvents="auto"
    >
      {smallToast ? (
        <NotificationContentSmall
          icon={icon}
          postCaptionElement={postCaptionElement}
          title={title}
          contentOverride={contentOverride}
          onPress={onNotificationPress}
          onPressIn={onPressIn}
        />
      ) : (
        <NotificationContent
          actionButton={actionButton ? { title: actionButton.title, onPress: onActionButtonPress } : undefined}
          icon={icon}
          postCaptionElement={postCaptionElement}
          subtitle={subtitle}
          title={title}
          contentOverride={contentOverride}
          onPress={onNotificationPress}
          onPressIn={onPressIn}
        />
      )}
    </Flex>
  )

  return isWeb ? (
    <WebToastEntryAnimation>{notificationContent}</WebToastEntryAnimation>
  ) : (
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

function NotificationContent({
  title,
  subtitle,
  icon,
  postCaptionElement,
  actionButton,
  onPress,
  onPressIn,
  contentOverride,
}: NotificationContentProps): JSX.Element {
  return (
    <TouchableArea
      alignItems="center"
      backgroundColor="$surface1"
      borderRadius={LARGE_TOAST_RADIUS}
      flex={1}
      flexDirection="row"
      minHeight={NOTIFICATION_HEIGHT}
      p="$spacing12"
      onPress={onPress}
      onPressIn={onPressIn}
    >
      {contentOverride ? (
        contentOverride
      ) : (
        <Flex row alignItems="center" gap="$spacing8" justifyContent="space-between" width="100%">
          <Flex
            row
            shrink
            alignItems="center"
            flexBasis={actionButton ? '75%' : '100%'}
            gap="$spacing12"
            justifyContent="flex-start"
          >
            {icon}
            <Flex shrink alignItems="flex-start" flexDirection="column">
              <ElementAfterText
                textProps={{
                  adjustsFontSizeToFit: true,
                  numberOfLines: subtitle ? 1 : 2,
                  testID: TestID.NotificationToastTitle,
                  variant: 'subheading2',
                }}
                text={title}
                element={postCaptionElement}
              />
              {subtitle && (
                <Text adjustsFontSizeToFit color="$neutral2" numberOfLines={1} variant="body3">
                  {subtitle}
                </Text>
              )}
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
      )}
    </TouchableArea>
  )
}

function NotificationContentSmall({
  title,
  icon,
  postCaptionElement,
  onPress,
  onPressIn,
  contentOverride: overrideContent,
}: NotificationContentProps): JSX.Element {
  return (
    <Flex centered row shrink pointerEvents="box-none">
      <TouchableArea
        backgroundColor="$surface1"
        borderRadius={SMALL_TOAST_RADIUS}
        p="$spacing12"
        onPress={onPress}
        onPressIn={onPressIn}
      >
        {overrideContent ? (
          overrideContent
        ) : (
          <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-start" pr="$spacing4">
            {icon && <Flex>{icon}</Flex>}
            <Text
              adjustsFontSizeToFit
              numberOfLines={title.length > MAX_TEXT_LENGTH ? 2 : 1}
              testID={TestID.NotificationToastTitle}
              variant={title.length > MAX_TEXT_LENGTH ? 'body3' : 'body2'}
            >
              {title}
            </Text>
            {postCaptionElement && <Flex>{postCaptionElement}</Flex>}
          </Flex>
        )}
      </TouchableArea>
    </Flex>
  )
}
