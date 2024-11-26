import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useEffect } from 'react'
import { Gesture, GestureDetector, State } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex, ImpactFeedbackStyle, Text, TouchableArea, useHapticFeedback } from 'ui/src'
import { CopyAlt, Settings } from 'ui/src/components/icons'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { sanitizeAddressText, shortenAddress } from 'uniswap/src/utils/addresses'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { isDevEnv } from 'utilities/src/environment/env'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { AnimatedUnitagDisplayName } from 'wallet/src/components/accounts/AnimatedUnitagDisplayName'
import useIsFocused from 'wallet/src/features/focus/useIsFocused'
import { useActiveAccount, useActiveAccountAddress, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

const RotatingSettingsIcon = ({ onPressSettings }: { onPressSettings(): void }): JSX.Element => {
  const isScreenFocused = useIsFocused()
  const pressProgress = useSharedValue(0)

  useEffect(() => {
    if (isScreenFocused) {
      pressProgress.value = withDelay(50, withTiming(0))
    }
  }, [isScreenFocused, pressProgress])

  const tap = Gesture.Tap()
    .withTestId(TestID.AccountHeaderSettings)
    .shouldCancelWhenOutside(true)
    .onBegin(() => {
      pressProgress.value = withTiming(1)
    })
    .onFinalize(({ state }) => {
      if (state === State.FAILED) {
        pressProgress.value = withTiming(0)
      } else if (state === State.END) {
        runOnJS(onPressSettings)()
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${pressProgress.value * 120}deg` }, { scale: 1 - pressProgress.value / 10 }],
      opacity: 1 - pressProgress.value / 2,
      justifyContent: 'center',
    }
  })

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={animatedStyle}>
        <Settings color="$neutral2" opacity={0.8} size="$icon.24" />
      </Animated.View>
    </GestureDetector>
  )
}

export function AccountHeader(): JSX.Element {
  const activeAddress = useActiveAccountAddress()
  const account = useActiveAccount()
  const dispatch = useDispatch()
  const { hapticFeedback } = useHapticFeedback()

  const { avatar } = useAvatar(activeAddress)
  const displayName = useDisplayName(activeAddress)

  // Log ENS and Unitag ownership for user usage stats
  useEffect(() => {
    switch (displayName?.type) {
      case DisplayNameType.ENS:
        setUserProperty(MobileUserPropertyName.HasLoadedENS, true)
        return
      case DisplayNameType.Unitag:
        setUserProperty(MobileUserPropertyName.HasLoadedUnitag, true)
        return
      default:
        return
    }
  }, [displayName?.type])

  const onPressAccountHeader = useCallback(() => {
    dispatch(openModal({ name: ModalName.AccountSwitcher }))
  }, [dispatch])

  const onPressSettings = (): void => {
    navigate(MobileScreens.SettingsStack, { screen: MobileScreens.Settings })
  }

  const onPressCopyAddress = async (): Promise<void> => {
    if (activeAddress) {
      await hapticFeedback.impact()
      await setClipboard(activeAddress)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.Address,
        }),
      )
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.CopyAddress,
        screen: MobileScreens.Home,
      })
    }
  }

  const walletHasName = displayName && displayName?.type !== DisplayNameType.Address
  const iconSize = 52

  return (
    <Flex gap="$spacing12" overflow="scroll" pt="$spacing8" px="$spacing12" testID="account-header" width="100%">
      {activeAddress && (
        <Flex alignItems="flex-start" gap="$spacing12" width="100%">
          <Flex row justifyContent="space-between" width="100%">
            <TouchableArea
              hapticFeedback
              alignItems="center"
              flexDirection="row"
              hapticStyle={ImpactFeedbackStyle.Medium}
              hitSlop={20}
              testID={TestID.AccountHeaderAvatar}
              onLongPress={async (): Promise<void> => {
                if (isDevEnv()) {
                  await hapticFeedback.selection()
                  dispatch(openModal({ name: ModalName.Experiments }))
                }
              }}
              onPress={onPressAccountHeader}
            >
              <AccountIcon
                address={activeAddress}
                avatarUri={avatar}
                showBackground={true}
                showViewOnlyBadge={account?.type === AccountType.Readonly}
                size={iconSize}
              />
            </TouchableArea>
            <RotatingSettingsIcon onPressSettings={onPressSettings} />
          </Flex>
          {walletHasName ? (
            <Flex
              row
              alignItems="center"
              gap="$spacing8"
              justifyContent="space-between"
              testID="account-header/display-name"
            >
              <TouchableArea hapticFeedback flexShrink={1} hitSlop={20} onPress={onPressAccountHeader}>
                <AnimatedUnitagDisplayName address={activeAddress} displayName={displayName} />
              </TouchableArea>
            </Flex>
          ) : (
            <TouchableArea
              hapticFeedback
              hitSlop={20}
              testID={TestID.AccountHeaderCopyAddress}
              onPress={onPressCopyAddress}
            >
              <Flex centered row shrink gap="$spacing4">
                <Text adjustsFontSizeToFit color="$neutral1" numberOfLines={1} variant="subheading2">
                  {sanitizeAddressText(shortenAddress(activeAddress))}
                </Text>
                <CopyAlt color="$neutral1" size="$icon.16" />
              </Flex>
            </TouchableArea>
          )}
        </Flex>
      )}
    </Flex>
  )
}
