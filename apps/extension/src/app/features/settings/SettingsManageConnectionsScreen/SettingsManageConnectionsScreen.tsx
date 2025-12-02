import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { removeAllDappConnectionsForAccount, removeDappConnection } from 'src/app/features/dapp/actions'
import { useAllDappConnectionsForActiveAccount } from 'src/app/features/dapp/hooks'
import { dappStore } from 'src/app/features/dapp/store'
import { NoDappConnections } from 'src/app/features/settings/SettingsManageConnectionsScreen/internal/NoDappConnections'
import { Flex, Text, TouchableArea, UniversalImage, useSporeColors } from 'ui/src'
import { MinusCircle } from 'ui/src/components/icons'
import { borderRadii, breakpoints, fonts, gap, iconSizes } from 'ui/src/theme'
import { DappIconPlaceholder } from 'uniswap/src/components/dapps/DappIconPlaceholder'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'
import { extractUrlHost } from 'utilities/src/format/urls'
import { DappEllipsisDropdown } from 'wallet/src/components/settings/DappEllipsisDropdown/DappEllipsisDropdown'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

const MIN_SCREEN_WIDTH = breakpoints.xxs
const HORIZONTAL_SPACING = 12
// when sidebar is at the minimum width (360px), this will allow 2 cards to cleanly fit per row
const TILE_WIDTH = (MIN_SCREEN_WIDTH - 3 * HORIZONTAL_SPACING) / 2

const titleVariant: keyof typeof fonts = 'body3'
const subtitleVariant: keyof typeof fonts = 'body4'
const textGap: number = gap.gap4
const textAreaHeight = fonts[titleVariant].lineHeight + fonts[subtitleVariant].lineHeight + textGap

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
        connectedAddresses: dappInfo?.connectedAccounts.map((account) => account.address) ?? [],
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

        const hostName = extractUrlHost(dappUrl)
        const title = dappInfo?.displayName || hostName

        const DeleteDappButton = (
          <TouchableArea
            animation={null}
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
        )

        const DappIcon = (
          <UniversalImage
            fallback={<DappIconPlaceholder iconSize={iconSizes.icon32} name={name.toUpperCase()} />}
            size={{
              height: iconSizes.icon32,
              width: iconSizes.icon32,
            }}
            style={{ image: { borderRadius: borderRadii.rounded8 } }}
            uri={dappInfo?.iconUrl}
          />
        )

        /**
         * TEXT AREA; TITLE/SUBTITLE
         *
         * we only need to set the text area height because it is the only section with optional fields
         */
        const Title = (
          <Flex alignItems="center" gap={textGap} maxWidth="100%" height={textAreaHeight}>
            <Text variant={titleVariant} maxWidth="100%" textAlign="center" numberOfLines={1} title={title}>
              {title}
            </Text>
            {hostName !== title && (
              <Text
                color="$neutral2"
                maxWidth="100%"
                variant={subtitleVariant}
                wordWrap="break-word"
                textAlign="center"
                numberOfLines={1}
                title={hostName}
              >
                {hostName}
              </Text>
            )}
          </Flex>
        )

        return (
          <Flex
            key={dappUrl}
            group
            alignItems="center"
            backgroundColor="$surface2"
            borderRadius="$rounded16"
            flexGrow={0}
            gap="$gap12"
            px="$spacing12"
            py="$spacing24"
            // when sidebar is at the minimum width (360px), this will allow 2 cards to cleanly fit per row
            width={TILE_WIDTH}
          >
            {DeleteDappButton}
            {DappIcon}
            {Title}
          </Flex>
        )
      }),
    [dappUrls, getHandleRemoveConnection, colors.neutral3],
  )

  const hasConnections = Boolean(DappTiles.length)

  return (
    <Trace logImpression screen={ExtensionScreens.ManageDappConnectionsScreen}>
      <ScreenHeader
        rightColumn={
          hasConnections ? (
            <DappEllipsisDropdown removeAllDappConnections={removeAllDappConnectionsForAccount} />
          ) : undefined
        }
        title={t('settings.setting.wallet.connections.title')}
      />
      <Flex row flexWrap="wrap" gap="$gap12">
        {hasConnections ? DappTiles : <NoDappConnections />}
      </Flex>
    </Trace>
  )
}
