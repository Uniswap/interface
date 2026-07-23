import { SharedEventName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { isWebPlatform } from '@universe/environment'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { Heart } from 'ui/src/components/icons/Heart'
import { HeartSlash } from 'ui/src/components/icons/HeartSlash'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { ReceiveAlt } from 'ui/src/components/icons/ReceiveAlt'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { ShareArrow } from 'ui/src/components/icons/ShareArrow'
import type { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { COPY_CLOSE_DELAY } from 'uniswap/src/constants/misc'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useSelectHasTokenFavorited } from 'uniswap/src/features/favorites/hooks/useSelectHasTokenFavorited'
import { useToggleFavoriteCallback } from 'uniswap/src/features/favorites/hooks/useToggleFavoriteCallback'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { currencyAddress, currencyId, currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { getTokenDetailsURL, type TDPView, tdpChainSelectionFromFilter } from 'uniswap/src/utils/linking'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export enum TokenContextMenuAction {
  CopyAddress = 'copyAddress',
  Favorite = 'favorite',
  Swap = 'swap',
  Send = 'send',
  Receive = 'receive',
  Share = 'share',
  ViewDetails = 'viewDetails',
  HideToken = 'hideToken',
}

export interface UseSearchTokenMenuItemsParams {
  currency: Currency
  closeMenu: () => void
  actions: TokenContextMenuAction[]
  /** Override the currency used for the share URL (e.g. for multichain "All networks" link). */
  shareCurrencyInfo?: { currencyId: string; chainId: UniverseChainId; tdpView?: TDPView }
  /** Override the copy address item entirely (e.g. for multichain address list transition). */
  copyAddressOverride?: {
    onPress: () => void | Promise<void>
    disabled?: boolean
    trailingIcon?: ReactNode
  }
}

export interface UseSearchTokenMenuItemsResult {
  menuItems: MenuOptionItem[]
  copiedAddress: boolean
  copiedUrl: boolean
}

export function useSearchTokenMenuItems({
  currency,
  closeMenu,
  actions,
  shareCurrencyInfo,
  copyAddressOverride,
}: UseSearchTokenMenuItemsParams): UseSearchTokenMenuItemsResult {
  const { t } = useTranslation()
  const evmAddress = useActiveAddress(Platform.EVM)
  const { navigateToTokenDetails, navigateToSwapFlow, navigateToSendFlow, navigateToReceive, handleShareToken } =
    useUniswapContext()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const trace = useTrace()

  const id = currencyId(currency)
  const tdpChainFilter = isUniverseChainId(currency.chainId) ? currency.chainId : undefined

  const onNavigateToTokenDetails = useCallback(() => {
    if (isTestnetModeEnabled) {
      return
    }
    closeMenu()
    navigateToTokenDetails(id, tdpChainSelectionFromFilter(tdpChainFilter))
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TokenItem,
      ...trace,
    })
  }, [isTestnetModeEnabled, closeMenu, navigateToTokenDetails, id, tdpChainFilter, trace])

  const onCopyAddress = useCallback(async (): Promise<void> => {
    await setClipboard(currencyAddress(currency))
    if (!isWebPlatform) {
      dispatch(pushNotification({ type: AppNotificationType.Copied, copyType: CopyNotificationType.Address }))
    }
    setCopiedAddress(true)
    setTimeout(() => {
      setCopiedAddress(false)
      closeMenu()
    }, COPY_CLOSE_DELAY)
  }, [dispatch, currency, closeMenu])

  const isFavoriteToken = useSelectHasTokenFavorited(id)
  const toggleFavorite = useToggleFavoriteCallback({ id, tokenName: currency.name, isFavoriteToken })
  const onToggleFavorite = useCallback(() => {
    toggleFavorite()
    closeMenu()
  }, [closeMenu, toggleFavorite])

  const onNavigateToSwap = useCallback(() => {
    closeMenu()
    navigateToSwapFlow({ outputCurrencyId: id })
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.Swap,
      ...trace,
    })
  }, [closeMenu, navigateToSwapFlow, id, trace])

  const onNavigateToSend = useCallback(() => {
    closeMenu()
    navigateToSendFlow({ chainId: currency.chainId, currencyAddress: currencyAddress(currency) })
  }, [closeMenu, currency, navigateToSendFlow])

  const onNavigateToReceive = useCallback(() => {
    closeMenu()
    navigateToReceive()
  }, [closeMenu, navigateToReceive])

  const shareId = shareCurrencyInfo?.currencyId ?? id
  const shareChain = shareCurrencyInfo?.chainId ?? currencyIdToChain(id) ?? undefined

  const onShare = useCallback(async () => {
    if (isWebPlatform) {
      const url =
        UNISWAP_WEB_URL +
        getTokenDetailsURL({
          address: currencyIdToAddress(shareId),
          chain: shareChain,
          tdpView: shareCurrencyInfo?.tdpView,
        })
      await setClipboard(url)
      setCopiedUrl(true)
      setTimeout(() => {
        setCopiedUrl(false)
        closeMenu()
      }, COPY_CLOSE_DELAY)
    } else {
      handleShareToken({ currencyId: shareId })
      closeMenu()
    }
  }, [closeMenu, handleShareToken, shareId, shareChain, shareCurrencyInfo?.tdpView])

  const copyAddressItem: MenuOptionItem | undefined = useMemo(() => {
    if (!actions.includes(TokenContextMenuAction.CopyAddress)) {
      return undefined
    }
    if (copyAddressOverride) {
      return {
        onPress: copyAddressOverride.onPress,
        disabled: copyAddressOverride.disabled ?? false,
        label: copiedAddress ? t('common.copied') : t('common.copy.address'),
        Icon: copiedAddress ? CheckCircleFilled : CopyAlt,
        closeDelay: COPY_CLOSE_DELAY,
        iconColor: copiedAddress ? '$statusSuccess' : '$neutral2',
        trailingIcon: copyAddressOverride.trailingIcon,
      }
    }
    if (isWebPlatform) {
      return {
        onPress: onCopyAddress,
        disabled: currency.isNative,
        label: copiedAddress ? t('common.copied') : t('common.copy.address'),
        Icon: copiedAddress ? CheckCircleFilled : CopyAlt,
        closeDelay: COPY_CLOSE_DELAY,
        iconColor: copiedAddress ? '$statusSuccess' : '$neutral2',
      }
    }
    return {
      onPress: onCopyAddress,
      disabled: currency.isNative,
      label: t('common.copy.address'),
      Icon: CopyAlt,
      iconColor: '$neutral2',
    }
  }, [actions, copyAddressOverride, onCopyAddress, currency.isNative, copiedAddress, t])

  const menuItems: MenuOptionItem[] = useMemo(() => {
    const options: MenuOptionItem[] = []
    const isSolanaToken = currencyIdToChain(id) === UniverseChainId.Solana

    if (copyAddressItem) {
      options.push(copyAddressItem)
    }

    if (actions.includes(TokenContextMenuAction.Favorite)) {
      options.push({
        onPress: onToggleFavorite,
        label: isFavoriteToken
          ? t('explore.wallets.favorite.action.remove.short')
          : t('explore.tokens.favorite.action.add'),
        Icon: isFavoriteToken ? HeartSlash : Heart,
        closeDelay: COPY_CLOSE_DELAY,
        iconColor: isFavoriteToken ? '$accent1' : '$neutral2',
      })
    }

    if (actions.includes(TokenContextMenuAction.Swap)) {
      options.push({
        onPress: onNavigateToSwap,
        label: t('common.button.swap'),
        Icon: CoinConvert,
        iconColor: '$neutral2',
      })
    }

    if (actions.includes(TokenContextMenuAction.Send) && !isSolanaToken) {
      options.push({
        onPress: onNavigateToSend,
        label: t('common.button.send'),
        Icon: SendAction,
        iconColor: '$neutral2',
      })
    }

    if (evmAddress && actions.includes(TokenContextMenuAction.Receive)) {
      options.push({
        onPress: onNavigateToReceive,
        label: t('common.button.receive'),
        Icon: ReceiveAlt,
        iconColor: '$neutral2',
      })
    }

    if (actions.includes(TokenContextMenuAction.Share)) {
      options.push({
        onPress: onShare,
        label: copiedUrl ? t('notification.copied.linkUrl') : t('common.button.share'),
        Icon: copiedUrl ? CheckCircleFilled : ShareArrow,
        closeDelay: COPY_CLOSE_DELAY,
        iconColor: copiedUrl ? '$statusSuccess' : '$neutral2',
      })
    }

    if (actions.includes(TokenContextMenuAction.ViewDetails)) {
      options.push({
        onPress: onNavigateToTokenDetails,
        label: t('token.details'),
        Icon: InfoCircleFilled,
        iconColor: '$neutral2',
      })
    }

    return options
  }, [
    id,
    actions,
    evmAddress,
    copyAddressItem,
    t,
    onToggleFavorite,
    isFavoriteToken,
    onNavigateToSwap,
    onNavigateToSend,
    onNavigateToReceive,
    onShare,
    copiedUrl,
    onNavigateToTokenDetails,
  ])

  return { menuItems, copiedAddress, copiedUrl }
}
