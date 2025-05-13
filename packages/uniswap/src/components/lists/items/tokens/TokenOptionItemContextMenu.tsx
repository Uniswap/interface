import { SharedEventName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { Heart } from 'ui/src/components/icons/Heart'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { ReceiveAlt } from 'ui/src/components/icons/ReceiveAlt'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { ShareArrow } from 'ui/src/components/icons/ShareArrow'
import { ContextMenu, ContextMenuProps, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { useAccountMeta, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSelectHasTokenFavorited } from 'uniswap/src/features/favorites/useSelectHasTokenFavorited'
import { useToggleFavoriteCallback } from 'uniswap/src/features/favorites/useToggleFavoriteCallback'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send.web'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { currencyAddress, currencyId, currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { isWeb } from 'utilities/src/platform'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const COPY_CLOSE_DELAY = 400

export enum TokenContextMenuAction {
  CopyAddress = 'copyAddress',
  Favorite = 'favorite', // wallet-only
  Swap = 'swap',
  Send = 'send',
  Receive = 'receive',
  Share = 'share',
  ViewDetails = 'viewDetails',
  HideToken = 'hideToken', // TODO(WEB-7614): implement hide token from portfolio
}

interface TokenOptionItemContextMenuProps {
  children: ReactNode
  currency: Currency
  isHiddenFromPortfolio?: boolean
  isOpen: boolean
  openMenu?: ContextMenuProps['openMenu']
  closeMenu: ContextMenuProps['closeMenu']
  triggerMode?: ContextMenuTriggerMode
  actions: TokenContextMenuAction[]
}

function _TokenOptionItemContextMenu({
  children,
  currency,
  isOpen,
  openMenu,
  closeMenu,
  triggerMode = ContextMenuTriggerMode.Secondary,
  actions,
}: TokenOptionItemContextMenuProps): JSX.Element {
  const { t } = useTranslation()
  const account = useAccountMeta()
  const { navigateToTokenDetails, navigateToSwapFlow, navigateToSendFlow, navigateToReceive, handleShareToken } =
    useUniswapContext()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const trace = useTrace()

  const id = currencyId(currency)

  const onNavigateToTokenDetails = useCallback(() => {
    if (isTestnetModeEnabled) {
      return
    }
    closeMenu()
    navigateToTokenDetails(id)
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TokenItem,
      ...trace,
    })
  }, [isTestnetModeEnabled, closeMenu, navigateToTokenDetails, id, trace])

  const onCopyAddress = useCallback(async (): Promise<void> => {
    await setClipboard(currencyAddress(currency))
    if (!isWeb) {
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.Address,
        }),
      )
    }
    setCopiedAddress(true)
    setTimeout(() => {
      setCopiedAddress(false)
      closeMenu()
    }, COPY_CLOSE_DELAY)
  }, [dispatch, currency, closeMenu])

  const isFavoriteToken = useSelectHasTokenFavorited(id)
  const toggleFavorite = useToggleFavoriteCallback(id, isFavoriteToken)
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

  const onShare = useCallback(async () => {
    if (isWeb) {
      const url =
        UNISWAP_WEB_URL +
        getTokenDetailsURL({
          address: currencyIdToAddress(id),
          chain: currencyIdToChain(id) ?? undefined,
        })
      await setClipboard(url)
      setCopiedUrl(true)
      setTimeout(() => {
        setCopiedUrl(false)
        closeMenu()
      }, COPY_CLOSE_DELAY)
    } else {
      handleShareToken({ currencyId: id })
      closeMenu()
    }
  }, [closeMenu, handleShareToken, id])

  const dropdownOptions: MenuOptionItem[] = useMemo(() => {
    const options: MenuOptionItem[] = []

    if (actions.includes(TokenContextMenuAction.CopyAddress)) {
      if (isWeb) {
        // onCopyAddress does not trigger a toast on web, so we display success in-line instead
        options.push({
          onPress: onCopyAddress,
          disabled: currency.isNative,
          label: copiedAddress ? t('notification.copied.address') : t('common.copy.address'),
          Icon: copiedAddress ? CheckCircleFilled : CopyAlt,
          closeDelay: COPY_CLOSE_DELAY,
          iconColor: copiedAddress ? '$statusSuccess' : '$neutral2',
        })
      } else {
        options.push({
          onPress: onCopyAddress,
          disabled: currency.isNative,
          label: t('common.copy.address'),
          Icon: CopyAlt,
          iconColor: '$neutral2',
        })
      }
    }

    if (actions.includes(TokenContextMenuAction.Favorite)) {
      options.push({
        onPress: onToggleFavorite,
        label: isFavoriteToken
          ? t('explore.wallets.favorite.action.remove.short')
          : t('explore.tokens.favorite.action.add'),
        Icon: Heart,
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

    if (actions.includes(TokenContextMenuAction.Send)) {
      options.push({
        onPress: onNavigateToSend,
        label: t('common.button.send'),
        Icon: SendAction,
        iconColor: '$neutral2',
      })
    }

    if (account && actions.includes(TokenContextMenuAction.Receive)) {
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
    actions,
    account,
    onCopyAddress,
    currency.isNative,
    copiedAddress,
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

  return (
    <ContextMenu
      menuItems={dropdownOptions}
      triggerMode={triggerMode}
      isOpen={isOpen}
      closeMenu={closeMenu}
      openMenu={openMenu}
      offsetY={4}
    >
      {children}
    </ContextMenu>
  )
}

export const TokenOptionItemContextMenu = React.memo(_TokenOptionItemContextMenu)
