import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router'
import { removeDappConnection, saveDappConnection } from 'src/app/features/dapp/actions'
import { useDappContext } from 'src/app/features/dapp/DappContext'
import { SwitchNetworksModal } from 'src/app/features/home/SwitchNetworksModal'
import { closePopup, PopupName } from 'src/app/features/popups/slice'
import { AppRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import {
  Anchor,
  Button,
  Circle,
  Flex,
  Popover,
  Text,
  TouchableArea,
  UniversalImage,
  UniversalImageResizeMode,
} from 'ui/src'
import { Power, RotatableChevron, X } from 'ui/src/components/icons'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { DappIconPlaceholder } from 'uniswap/src/components/dapps/DappIconPlaceholder'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'
import { extractUrlHost } from 'utilities/src/format/urls'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function ConnectPopupContent({
  onClose,
  asPopover = false,
}: {
  onClose?: () => void

  asPopover?: boolean
  showConnectButton?: boolean
}): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { navigateTo } = useExtensionNavigation()

  const { dappUrl, dappIconUrl, isConnected, lastChainId } = useDappContext()
  const uppercaseDappName = extractNameFromUrl(dappUrl)
  const activeAccount = useActiveAccountWithThrow()

  const [isSwitchNetworksModalOpen, setSwitchNetworksModalOpen] = useState(false)

  const onConnect = async (): Promise<void> => {
    await saveDappConnection({ dappUrl, account: activeAccount, iconUrl: dappIconUrl })
    dispatch(pushNotification({ type: AppNotificationType.DappConnected, dappIconUrl }))
    dispatch(closePopup(PopupName.Connect))
    sendAnalyticsEvent(ExtensionEventName.SidebarConnect, { dappUrl })
  }

  const onDisconnect = async (): Promise<void> => {
    await removeDappConnection(dappUrl, activeAccount)
    dispatch(pushNotification({ type: AppNotificationType.DappDisconnected, dappIconUrl }))
    dispatch(closePopup(PopupName.Connect))
    sendAnalyticsEvent(ExtensionEventName.SidebarDisconnect)
  }

  const openSwitchNetworkModal = (): void => {
    setSwitchNetworksModalOpen(true)
  }

  const closeSwitchNetworkModal = (): void => {
    setSwitchNetworksModalOpen(false)
  }

  const openManageConnections = (): void => {
    navigateTo(`/${AppRoutes.Settings}/${SettingsRoutes.ManageConnections}`)
  }

  const fallbackIcon = <DappIconPlaceholder iconSize={iconSizes.icon40} name={dappUrl} />

  return (
    <Flex px="$spacing8" py="$spacing4" width={252}>
      {isSwitchNetworksModalOpen ? (
        <SwitchNetworksModal onPress={closeSwitchNetworkModal} />
      ) : (
        <Flex>
          <Flex row gap="$gap8" alignItems="center" justifyContent="center">
            <Flex
              borderRadius="$roundedFull"
              borderColor="$surface3"
              alignItems="center"
              opacity={isConnected ? 1 : 0.7}
            >
              <UniversalImage
                style={{
                  image: { borderRadius: borderRadii.roundedFull },
                }}
                fallback={fallbackIcon}
                size={{
                  width: iconSizes.icon28,
                  height: iconSizes.icon28,
                  resizeMode: UniversalImageResizeMode.Contain,
                }}
                uri={dappIconUrl}
              />
            </Flex>
            <Flex fill>
              <Text variant="body3">{uppercaseDappName.charAt(0).toUpperCase() + uppercaseDappName.slice(1)}</Text>
              <Anchor href={dappUrl} textDecorationLine="none">
                <Flex>
                  <Text color="$neutral2" numberOfLines={1} variant="buttonLabel4">
                    {extractUrlHost(dappUrl)}
                  </Text>
                </Flex>
              </Anchor>
            </Flex>

            {!asPopover && (
              <TouchableArea onPress={onClose}>
                <X color="$neutral3" size="$icon.20" />
              </TouchableArea>
            )}
          </Flex>
          <Flex row pt="$padding16" justifyContent="space-between" alignItems="center">
            <Flex row gap="$gap8">
              <Flex borderRadius="$roundedFull" alignItems="center" justifyContent="center">
                <Circle
                  backgroundColor={isConnected ? '$statusSuccess' : '$neutral3'}
                  height={iconSizes.icon8}
                  width={iconSizes.icon8}
                />
              </Flex>

              <Text color={isConnected ? '$statusSuccess' : '$neutral2'} variant="body3">
                {isConnected ? t('extension.connection.titleConnected') : t('extension.connection.titleNotConnected')}
              </Text>
            </Flex>

            {lastChainId && (
              <TouchableArea
                key={lastChainId}
                borderRadius="$rounded8"
                hoverStyle={{ backgroundColor: '$surface2' }}
                justifyContent="space-between"
                p="$spacing4"
                onPress={openSwitchNetworkModal}
              >
                <Flex grow row alignItems="center" justifyContent="space-between">
                  <Flex grow row alignItems="center" gap="$spacing8" pl="$gap4">
                    <Flex borderWidth="$spacing2" borderRadius="$rounded8" borderColor="$surface1">
                      <NetworkLogo chainId={lastChainId} size={iconSizes.icon20} />
                    </Flex>
                    <Text color="$neutral1" variant="buttonLabel4">
                      {getChainLabel(lastChainId)}
                    </Text>
                  </Flex>
                  <RotatableChevron
                    color="$neutral3"
                    direction="right"
                    flexShrink={1}
                    height={iconSizes.icon24}
                    width={iconSizes.icon24}
                  />
                </Flex>
              </TouchableArea>
            )}
          </Flex>

          {!isConnected && (
            <Flex pt="$padding6">
              <Link
                style={{ textDecoration: 'none' }}
                target="_blank"
                to={uniswapUrls.helpArticleUrls.extensionDappTroubleshooting}
                onClick={() =>
                  sendAnalyticsEvent(ExtensionEventName.DappTroubleConnecting, {
                    dappUrl,
                  })
                }
              >
                <Text color="$accent1" variant="buttonLabel4">
                  {t('extension.connection.popup.trouble')}
                </Text>
              </Link>
            </Flex>
          )}

          <Flex gap="$spacing8" pt="$padding12">
            <Popover.Close onPress={openManageConnections}>
              <Flex row>
                <Button size="small" variant="default" emphasis="tertiary">
                  {t('account.wallet.menu.manageConnections')}
                </Button>
              </Flex>
            </Popover.Close>

            {isConnected ? (
              <Popover.Close asChild>
                <Flex row>
                  <Button icon={<Power />} size="small" emphasis="secondary" onPress={onDisconnect}>
                    {t('common.button.disconnect')}
                  </Button>
                </Flex>
              </Popover.Close>
            ) : (
              <Popover.Close asChild>
                <Flex row>
                  <Button size="small" emphasis="primary" onPress={onConnect}>
                    {t('common.button.connect')}
                  </Button>
                </Flex>
              </Popover.Close>
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
