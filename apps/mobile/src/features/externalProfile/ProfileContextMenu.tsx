import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useDispatch } from 'react-redux'
import { TripleDot } from 'src/components/icons/TripleDot'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, HapticFeedback, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { ExplorerDataType, getExplorerLink, getProfileUrl } from 'wallet/src/utils/linking'

type MenuAction = {
  title: string
  action: () => void
  systemIcon: string
}

export function ProfileContextMenu({ address }: { address: Address }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { unitag } = useUnitagByAddress(address)

  const onPressCopyAddress = useCallback(async () => {
    if (!address) {
      return
    }
    await HapticFeedback.impact()
    await setClipboard(address)
    dispatch(pushNotification({ type: AppNotificationType.Copied, copyType: CopyNotificationType.Address }))
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CopyAddress,
      screen: MobileScreens.ExternalProfile,
    })
  }, [address, dispatch])

  const openExplorerLink = useCallback(async () => {
    await openUri(getExplorerLink(UniverseChainId.Mainnet, address, ExplorerDataType.ADDRESS))
  }, [address])

  const onReportProfile = useCallback(async () => {
    const params = new URLSearchParams()
    params.append('tf_11041337007757', address) // Wallet Address
    params.append('tf_7005922218125', 'report_unitag') // Report Type Dropdown
    const prefilledRequestUrl = uniswapUrls.helpRequestUrl + '?' + params.toString()
    openUri(prefilledRequestUrl).catch((e) =>
      logger.error(e, { tags: { file: 'ProfileContextMenu', function: 'reportProfileLink' } }),
    )
  }, [address])

  const onPressShare = useCallback(async () => {
    if (!address) {
      return
    }
    try {
      const url = getProfileUrl(address)
      await Share.share({
        message: url,
      })
      sendAnalyticsEvent(WalletEventName.ShareButtonClicked, {
        entity: ShareableEntity.Wallet,
        url,
      })
    } catch (error) {
      logger.error(error, { tags: { file: 'ProfileContextMenu', function: 'onPressShare' } })
    }
  }, [address])

  const menuActions = useMemo(() => {
    const options: MenuAction[] = [
      {
        title: t('account.wallet.action.viewExplorer', {
          blockExplorerName: UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet].explorer.name,
        }),
        action: openExplorerLink,
        systemIcon: 'link',
      },
      {
        title: t('account.wallet.action.copy'),
        action: onPressCopyAddress,
        systemIcon: 'square.on.square',
      },
      {
        title: t('common.button.share'),
        action: onPressShare,
        systemIcon: 'square.and.arrow.up',
      },
    ]
    if (unitag) {
      options.push({
        title: t('account.wallet.action.report'),
        action: onReportProfile,
        systemIcon: 'flag',
      })
    }
    return options
  }, [onPressCopyAddress, onPressShare, onReportProfile, openExplorerLink, t, unitag])

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
        await menuActions[e.nativeEvent.index]?.action()
      }}
    >
      <TouchableArea
        backgroundColor="$surface3"
        borderRadius="$roundedFull"
        opacity={0.8}
        p="$spacing8"
        onLongPress={disableOnPress}
      >
        <Flex centered grow height={iconSizes.icon16} width={iconSizes.icon16}>
          <TripleDot color="$sporeWhite" size={3.5} />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
