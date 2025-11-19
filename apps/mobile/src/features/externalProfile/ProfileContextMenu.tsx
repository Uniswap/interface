import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useDispatch } from 'react-redux'
import { TouchableArea } from 'ui/src'
import { Ellipsis } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { ExplorerDataType, getExplorerLink, getProfileUrl, openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { noop } from 'utilities/src/react/noop'

type MenuAction = {
  title: string
  action: () => void
  systemIcon: string
}

export function ProfileContextMenu({ address }: { address: Address }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { data: unitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const { defaultChainId } = useEnabledChains()

  const onPressCopyAddress = useCallback(async () => {
    if (!address) {
      return
    }

    await setClipboard(address)
    dispatch(pushNotification({ type: AppNotificationType.Copied, copyType: CopyNotificationType.Address }))
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CopyAddress,
      screen: MobileScreens.ExternalProfile,
    })
  }, [address, dispatch])

  const openExplorerLink = useCallback(async () => {
    await openUri({
      uri: getExplorerLink({ chainId: defaultChainId, data: address, type: ExplorerDataType.ADDRESS }),
    })
  }, [address, defaultChainId])

  const onReportProfile = useCallback(async () => {
    const params = new URLSearchParams()
    params.append('tf_11041337007757', address) // Wallet Address
    params.append('tf_7005922218125', 'report_unitag') // Report Type Dropdown
    const prefilledRequestUrl = uniswapUrls.helpRequestUrl + '?' + params.toString()
    openUri({ uri: prefilledRequestUrl }).catch((e) =>
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
          blockExplorerName: getChainInfo(defaultChainId).explorer.name,
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
  }, [onPressCopyAddress, onPressShare, onReportProfile, openExplorerLink, t, unitag, defaultChainId])

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
        await menuActions[e.nativeEvent.index]?.action()
      }}
    >
      <TouchableArea centered backgroundColor="$surface4" borderRadius="$roundedFull" p="$spacing8" onLongPress={noop}>
        <Ellipsis color="$neutral2" size="$icon.16" />
      </TouchableArea>
    </ContextMenu>
  )
}
