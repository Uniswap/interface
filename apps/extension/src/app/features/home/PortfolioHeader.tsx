import { SharedEventName } from '@uniswap/analytics-events'
import { memo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useDappContext } from 'src/app/features/dapp/DappContext'
import { useDappConnectedAccounts } from 'src/app/features/dapp/hooks'
import { SwitchNetworksModal } from 'src/app/features/home/SwitchNetworksModal'
import { ConnectPopupContent } from 'src/app/features/popups/ConnectPopup'
import { selectPopupState } from 'src/app/features/popups/selectors'
import { PopupName, closePopup, openPopup } from 'src/app/features/popups/slice'
import { AppRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Circle, Flex, Popover, Text, TouchableArea, UniversalImage } from 'ui/src'
import { animationPresets } from 'ui/src/animations'
import { CopyAlt, Globe, RotatableChevron, Settings } from 'ui/src/components/icons'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletChainId } from 'uniswap/src/types/chains'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { sanitizeAddressText, shortenAddress } from 'uniswap/src/utils/addresses'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'
import { DappIconPlaceholder } from 'wallet/src/components/WalletConnect/DappIconPlaceholder'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { AnimatedUnitagDisplayName } from 'wallet/src/components/accounts/AnimatedUnitagDisplayName'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

const POPUP_SHADOW_RADIUS = 4

type PortfolioHeaderProps = {
  address: Address
}

export const PortfolioHeader = memo(function _PortfolioHeader({ address }: PortfolioHeaderProps): JSX.Element {
  const dispatch = useDispatch()

  const displayName = useDisplayName(address)
  const { avatar } = useAvatar(address)
  const walletHasName = displayName && displayName?.type !== DisplayNameType.Address
  const formattedAddress = sanitizeAddressText(shortenAddress(address))
  const { isOpen: isPopupOpen } = useSelector(selectPopupState(PopupName.Connect))

  // Used to delay popup showing on initial render, which leads to improper anchoring
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    setTimeout(() => setInitialized(true), 100)
  }, [])

  const onPressAccount = async (): Promise<void> => {
    dispatch(closePopup(PopupName.Connect))
    navigate(AppRoutes.AccountSwitcher)
  }

  const { isConnected, lastChainId, dappUrl, dappIconUrl } = useDappContext()
  const connectedAccounts = useDappConnectedAccounts(dappUrl)
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

  return (
    <Flex gap="$spacing8">
      <Flex row justifyContent="space-between">
        <TouchableArea pressStyle={{ scale: 0.95 }} onPress={onPressAccount}>
          <Flex group row alignItems="center" gap="$spacing4">
            <Flex $group-hover={{ opacity: 0.6 }}>
              <AccountIcon address={address} avatarUri={avatar} size={iconSizes.icon48} />
            </Flex>
            <Flex $group-hover={{ opacity: 1 }} opacity={0}>
              <RotatableChevron color="$neutral3" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
            </Flex>
          </Flex>
        </TouchableArea>
        <Flex row alignItems="center" gap="$spacing4" justifyContent="space-around">
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
                <TouchableArea hoverable borderRadius="$roundedFull" p="$spacing8">
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
                borderWidth={1}
                disableRemoveScroll={false}
                zIndex="$default"
                {...animationPresets.fadeInDownOutUp}
                shadowColor="$shadowColor"
                shadowRadius={POPUP_SHADOW_RADIUS}
              >
                <Popover.Arrow backgroundColor="transparent" />
                {isConnected ? (
                  <SwitchNetworksModal />
                ) : (
                  <ConnectPopupContent
                    asPopover
                    showConnectButton={connectedAccounts.length > 0 && !isConnected}
                    onClose={(): void => onClosePopup()}
                  />
                )}
              </Popover.Content>
            </Popover>
          )}
          <TouchableArea
            hoverable
            borderRadius="$roundedFull"
            p="$spacing8"
            onPress={(): void => navigate('/settings')}
          >
            <Settings color="$neutral2" size="$icon.20" />
          </TouchableArea>
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
  lastChainId?: WalletChainId
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
          borderWidth={2}
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
