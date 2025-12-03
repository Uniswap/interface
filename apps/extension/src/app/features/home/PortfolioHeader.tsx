import { SharedEventName } from '@uniswap/analytics-events'
import { memo, useEffect, useState } from 'react'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { useDappContext } from 'src/app/features/dapp/DappContext'
import { ConnectPopupContent } from 'src/app/features/popups/ConnectPopup'
import { selectPopupState } from 'src/app/features/popups/selectors'
import { closePopup, openPopup, PopupName } from 'src/app/features/popups/slice'
import { AppRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Circle, Flex, Popover, Text, TouchableArea, UniversalImage } from 'ui/src'
import { animationPresets } from 'ui/src/animations'
import { CopyAlt, Globe, RotatableChevron, Settings } from 'ui/src/components/icons'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { DappIconPlaceholder } from 'uniswap/src/components/dapps/DappIconPlaceholder'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { shortenAddress } from 'utilities/src/addresses'
import { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'
import { AnimatedUnitagDisplayName } from 'wallet/src/components/accounts/AnimatedUnitagDisplayName'
import useIsFocused from 'wallet/src/features/focus/useIsFocused'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

const POPUP_SHADOW_RADIUS = 4

type PortfolioHeaderProps = {
  address: Address
}

// this variable is used to flag when user go to settings screen from home touching the settings icon
// we can't use useState here because screen is mounted everytime screen is entered so all state would be lost
// it's not in any kind of Context because it's only animation variable and it shouldn't trigger rerenders
let shouldEnableAnimationNextEnter = false

const RotatingSettingsIcon = ({ onPressSettings }: { onPressSettings(): void }): JSX.Element => {
  const isScreenFocused = useIsFocused()
  const pressProgress = useSharedValue(0)

  useEffect(() => {
    if (isScreenFocused && shouldEnableAnimationNextEnter) {
      pressProgress.value = 1
      pressProgress.value = withDelay(
        50,
        withTiming(0, {}, () => {
          shouldEnableAnimationNextEnter = false
        }),
      )
    }
  }, [isScreenFocused])

  const onBegin = (): void => {
    pressProgress.value = withTiming(1)
  }

  const onCancel = (): void => {
    pressProgress.value = withTiming(0)
  }

  const onPressSettingsLocal = (): void => {
    shouldEnableAnimationNextEnter = true
    onPressSettings()
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${pressProgress.value * 120}deg` }, { scale: 1 - pressProgress.value / 10 }],
      opacity: 1 - pressProgress.value / 2,
      justifyContent: 'center',
    }
  }, [pressProgress])

  return (
    <TouchableArea
      hoverable
      borderRadius="$roundedFull"
      p="$spacing6"
      onHoverIn={onBegin}
      onHoverOut={onCancel}
      onPress={onPressSettingsLocal}
    >
      <Animated.View style={animatedStyle} testID={TestID.AccountHeaderSettings}>
        <Settings color="$neutral2" size="$icon.20" />
      </Animated.View>
    </TouchableArea>
  )
}

export const PortfolioHeader = memo(function _PortfolioHeader({ address }: PortfolioHeaderProps): JSX.Element {
  const dispatch = useDispatch()

  const displayName = useDisplayName(address)
  const walletHasName = displayName && displayName.type !== DisplayNameType.Address
  const formattedAddress = sanitizeAddressText(shortenAddress({ address }))
  const { isOpen: isPopupOpen } = useSelector(selectPopupState(PopupName.Connect))

  // Used to delay popup showing on initial render, which leads to improper anchoring
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    setTimeout(() => setInitialized(true), 100)
  }, [])

  const onPressAccount = async (): Promise<void> => {
    dispatch(closePopup(PopupName.Connect))
    navigate(`/${AppRoutes.AccountSwitcher}`)
  }

  const { isConnected, lastChainId, dappUrl, dappIconUrl } = useDappContext()
  const showConnectionStatus = isConnected || dappUrl.startsWith('http://') || dappUrl.startsWith('https://')

  const toggleConnectPopup = (): void => {
    if (isPopupOpen) {
      dispatch(closePopup(PopupName.Connect))
    } else {
      dispatch(openPopup(PopupName.Connect))
    }
  }

  const onClosePopup = (): void => {
    dispatch(closePopup(PopupName.Connect))
  }

  const onPressCopyAddress = async (): Promise<void> => {
    if (address) {
      await setClipboard(address)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.Address,
        }),
      )
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.CopyAddress,
        screen: ExtensionScreens.Home,
      })
    }
  }

  const onPressSettings = (): void => {
    navigate('/settings')
  }

  return (
    <Flex gap="$spacing8">
      <Flex row justifyContent="space-between" alignItems="flex-start">
        <TouchableArea pressStyle={{ scale: 0.95 }} onPress={onPressAccount}>
          <Flex group row alignItems="center" gap="$spacing4">
            <Flex $group-hover={{ opacity: 0.6 }}>
              <AccountIcon address={address} size={iconSizes.icon48} />
            </Flex>
            <Flex $group-hover={{ opacity: 1 }} opacity={0}>
              <RotatableChevron color="$neutral3" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
            </Flex>
          </Flex>
        </TouchableArea>
        <Flex row alignItems="center" gap="$spacing6" justifyContent="space-around">
          {showConnectionStatus && (
            <Popover
              offset={10}
              open={initialized && isPopupOpen}
              stayInFrame={{ padding: 10 }}
              onOpenChange={(open) => {
                if (!open) {
                  // Used to close the popup when the user clicks outside of it
                  onClosePopup()
                }
              }}
            >
              <Popover.Trigger onPress={toggleConnectPopup}>
                <TouchableArea hoverable borderRadius="$roundedFull" p="$spacing6">
                  <ConnectionStatusIcon
                    dappIconUrl={dappIconUrl}
                    dappUrl={dappUrl}
                    isConnected={isConnected}
                    lastChainId={lastChainId}
                  />
                </TouchableArea>
              </Popover.Trigger>
              <Popover.Content
                animation="quicker"
                borderColor="$surface2"
                borderRadius="$rounded20"
                borderWidth="$spacing1"
                enableRemoveScroll={true}
                zIndex="$default"
                {...animationPresets.fadeInDownOutUp}
                shadowColor="$shadowColor"
                shadowRadius={POPUP_SHADOW_RADIUS}
              >
                <Popover.Arrow backgroundColor="transparent" />
                <ConnectPopupContent asPopover onClose={onClosePopup} />
              </Popover.Content>
            </Popover>
          )}
          <RotatingSettingsIcon onPressSettings={onPressSettings} />
        </Flex>
      </Flex>
      <Flex row alignItems="center">
        {walletHasName ? (
          <AnimatedUnitagDisplayName address={address} displayName={displayName} />
        ) : (
          <TouchableArea testID="account-header/address-only" onPress={onPressCopyAddress}>
            <Flex centered row shrink gap="$spacing4">
              <Text adjustsFontSizeToFit color="$neutral1" numberOfLines={1} variant="subheading1">
                {formattedAddress}
              </Text>
              <CopyAlt color="$neutral3" size="$icon.16" />
            </Flex>
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
})

function ConnectionStatusIcon({
  isConnected,
  lastChainId,
  dappIconUrl,
  dappUrl,
}: {
  isConnected: boolean
  lastChainId?: UniverseChainId
  dappIconUrl?: string
  dappUrl?: string
}): JSX.Element {
  const uppercaseDappName = extractNameFromUrl(dappUrl).toUpperCase()
  const isConnectedToNetwork = isConnected && lastChainId
  return isConnectedToNetwork ? (
    <Flex>
      <UniversalImage
        fallback={<DappIconPlaceholder iconSize={iconSizes.icon20} name={uppercaseDappName} />}
        size={{ height: iconSizes.icon20, width: iconSizes.icon20 }}
        style={{ image: { borderRadius: borderRadii.rounded8 } }}
        uri={dappIconUrl}
      />
      <Flex backgroundColor="$surface2" borderRadius="$roundedFull" position="absolute" right={8} top={-3}>
        <Circle
          backgroundColor="$statusSuccess"
          borderColor="$surface1"
          borderWidth="$spacing2"
          height={iconSizes.icon12}
          mr="$spacing8"
          position="absolute"
          width={iconSizes.icon12}
          zIndex="$popover"
        />
      </Flex>
    </Flex>
  ) : (
    <Globe color="$neutral2" size="$icon.20" />
  )
}
