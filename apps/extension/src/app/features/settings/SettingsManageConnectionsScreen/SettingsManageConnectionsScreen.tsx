import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { removeDappConnection } from 'src/app/features/dapp/actions'
import { useAllDappConnectionsForActiveAccount } from 'src/app/features/dapp/hooks'
import { dappStore } from 'src/app/features/dapp/store'
import { EllipsisDropdown } from 'src/app/features/settings/SettingsManageConnectionsScreen/internal/EllipsisDropdown'
import { NoDappConnections } from 'src/app/features/settings/SettingsManageConnectionsScreen/internal/NoDappConnections'
import { Flex, Text, TouchableArea, UniversalImage, useSporeColors } from 'ui/src'
import { MinusCircle } from 'ui/src/components/icons'
import { borderRadii, breakpoints, iconSizes } from 'ui/src/theme'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'
import { extractUrlHost } from 'utilities/src/format/urls'
import { DappIconPlaceholder } from 'wallet/src/components/WalletConnect/DappIconPlaceholder'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

const MIN_SCREEN_WIDTH = breakpoints.xxs
const HORIZONTAL_SPACING = 12
// when sidebar is at the minimum width (360px), this will allow 2 cards to cleanly fit per row
const TILE_WIDTH = (MIN_SCREEN_WIDTH - 3 * HORIZONTAL_SPACING) / 2

export function SettingsManageConnectionsScreen(): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()

  const dappUrls = useAllDappConnectionsForActiveAccount()

  const getHandleRemoveConnection = useCallback(
    (dappUrl: string) => async () => {
      const dappInfo = dappStore.getDappInfo(dappUrl)

      dispatch(
        pushNotification({
          type: AppNotificationType.DappDisconnected,
          dappIconUrl: dappStore.getDappInfo(dappUrl)?.iconUrl,
        }),
      )
      sendAnalyticsEvent(ExtensionEventName.DappDisconnect, {
        dappUrl,
        chainId: dappInfo?.lastChainId,
        activeConnectedAddress: dappInfo?.activeConnectedAddress,
        connectedAddresses: dappInfo?.connectedAccounts?.map((account) => account.address) ?? [],
      })
      await removeDappConnection(dappUrl, activeAccount)
    },
    [dispatch, activeAccount],
  )

  const DappTiles = useMemo(
    () =>
      dappUrls.map((dappUrl) => {
        const dappInfo = dappStore.getDappInfo(dappUrl)
        const name = extractNameFromUrl(dappUrl)
        return (
          <Flex
            key={dappUrl}
            group
            centered
            backgroundColor="$surface2"
            borderRadius="$rounded16"
            flexGrow={0}
            gap="$gap12"
            px="$spacing12"
            py="$spacing24"
            // when sidebar is at the minimum width (360px), this will allow 2 cards to cleanly fit per row
            width={TILE_WIDTH}
          >
            <TouchableArea
              $group-hover={{ display: 'flex' }}
              display="none"
              p="$spacing2"
              position="absolute"
              right="$padding8"
              top="$padding8"
              onPress={getHandleRemoveConnection(dappUrl)}
            >
              <MinusCircle size="$icon.20" fill={colors.neutral3.get()} />
            </TouchableArea>

            <UniversalImage
              fallback={<DappIconPlaceholder iconSize={iconSizes.icon32} name={name.toUpperCase()} />}
              size={{
                height: iconSizes.icon32,
                width: iconSizes.icon32,
              }}
              style={{ image: { borderRadius: borderRadii.rounded8 } }}
              uri={dappInfo?.iconUrl}
            />
            <Flex alignItems="center" gap="$gap4" maxWidth="100%">
              <Text variant="body3">{dappInfo?.displayName || name}</Text>
              <Text color="$neutral2" maxWidth="100%" variant="body4" wordWrap="break-word">
                {extractUrlHost(dappUrl)}
              </Text>
            </Flex>
          </Flex>
        )
      }),
    [dappUrls, getHandleRemoveConnection, colors.neutral3],
  )

  const hasConnections = Boolean(DappTiles?.length)

  return (
    <Trace logImpression screen={ExtensionScreens.ManageDappConnectionsScreen}>
      <ScreenHeader
        rightColumn={hasConnections ? <EllipsisDropdown /> : undefined}
        title={t('settings.setting.wallet.connections.title')}
      />
      <Flex row flexWrap="wrap" gap="$gap12">
        {hasConnections ? DappTiles : <NoDappConnections />}
      </Flex>
    </Trace>
  )
}
