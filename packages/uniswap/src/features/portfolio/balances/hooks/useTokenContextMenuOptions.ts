import { SharedEventName } from '@uniswap/analytics-events'
import { isNativeCurrency } from '@uniswap/universal-router-sdk'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ChartBarCrossed, Flag } from 'ui/src/components/icons'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { ReceiveAlt } from 'ui/src/components/icons/ReceiveAlt'
import { SendAction } from 'ui/src/components/icons/SendAction'
import { ShareArrow } from 'ui/src/components/icons/ShareArrow'
import { MenuOptionItemWithId } from 'uniswap/src/components/menus/ContextMenuV2'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { selectHasViewedContractAddressExplainer } from 'uniswap/src/features/behaviorHistory/selectors'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioCacheUpdater } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName, SectionName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTokenVisibility } from 'uniswap/src/features/visibility/hooks/useTokenVisibility'
import { setTokenVisibility } from 'uniswap/src/features/visibility/slice'
import { CurrencyField, CurrencyId } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual, currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { isExtensionApp, isMobileApp, isWebPlatform } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export enum TokenMenuActionType {
  Swap = 'swap',
  Send = 'send',
  Receive = 'receive',
  Share = 'share',
  ViewDetails = 'viewDetails',
  ToggleVisibility = 'toggleVisibility',
  CopyAddress = 'copyAddress',
  ReportToken = 'reportToken',
  DataIssue = 'dataIssue',
}

interface TokenMenuParams {
  currencyId: CurrencyId
  isBlocked: boolean
  tokenSymbolForNotification?: Nullable<string>
  portfolioBalance?: Nullable<PortfolioBalance>
  excludedActions?: TokenMenuActionType[]
  openContractAddressExplainerModal?: () => void
  openReportTokenModal: () => void
  openReportDataIssueModal?: () => void
  copyAddressToClipboard?: (address: string) => Promise<void>
  closeMenu: () => void
}

const CLOSE_MENU_DELAY = ONE_SECOND_MS / 4

export function useTokenContextMenuOptions({
  currencyId,
  isBlocked,
  tokenSymbolForNotification,
  portfolioBalance,
  excludedActions,
  openContractAddressExplainerModal,
  openReportTokenModal,
  openReportDataIssueModal,
  copyAddressToClipboard,
  closeMenu,
}: TokenMenuParams): MenuOptionItemWithId[] {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const isDataReportingEnabled = useFeatureFlag(FeatureFlags.DataReportingAbilities)

  const { defaultChainId } = useEnabledChains()
  const activeAddresses = useActiveAddresses()

  const { navigateToSwapFlow, navigateToReceive, navigateToSendFlow, handleShareToken, navigateToTokenDetails } =
    useUniswapContext()

  const activeAccountHoldsToken =
    portfolioBalance && areCurrencyIdsEqual(currencyId, portfolioBalance.currencyInfo.currencyId)
  const isVisible = useTokenVisibility(currencyId, portfolioBalance?.isHidden)

  const currencyAddress = currencyIdToAddress(currencyId)
  const isNative = isNativeCurrency(currencyAddress)
  const maybeCurrencyChainId = currencyIdToChain(currencyId)
  const currencyChainId = maybeCurrencyChainId ? (maybeCurrencyChainId as UniverseChainId) : defaultChainId
  const { isTestnetModeEnabled } = useEnabledChains()

  const onPressSend = useCallback(() => {
    // Do not show warning modal speed-bump if user is trying to send tokens they own
    closeMenu()
    setTimeout(() => {
      navigateToSendFlow({ currencyAddress, chainId: currencyChainId })
    }, CLOSE_MENU_DELAY)
  }, [currencyAddress, currencyChainId, navigateToSendFlow, closeMenu])

  const onPressSwap = useCallback(
    (currencyField: CurrencyField) => {
      closeMenu()
      setTimeout(() => {
        // Do not show warning modal speed-bump if user is trying to swap tokens they own
        if (currencyField === CurrencyField.INPUT) {
          navigateToSwapFlow({ inputCurrencyId: currencyId })
        } else {
          navigateToSwapFlow({ outputCurrencyId: currencyId })
        }
      }, CLOSE_MENU_DELAY)
    },
    [currencyId, navigateToSwapFlow, closeMenu],
  )

  const onPressViewDetails = useCallback(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TokenItem,
      section: SectionName.HomeTokensTab,
    })
    navigateToTokenDetails(currencyId)
  }, [navigateToTokenDetails, currencyId])

  const onPressShare = useCallback(async () => {
    handleShareToken({ currencyId })
  }, [currencyId, handleShareToken])

  const updateCache = usePortfolioCacheUpdater(activeAddresses.evmAddress, activeAddresses.svmAddress)

  const hasViewedContractAddressExplainer = useSelector(selectHasViewedContractAddressExplainer)

  const onPressCopyAddress = useCallback(async () => {
    if (isMobileApp && !hasViewedContractAddressExplainer) {
      openContractAddressExplainerModal?.()
      return
    }

    await copyAddressToClipboard?.(currencyAddress)
  }, [currencyAddress, hasViewedContractAddressExplainer, openContractAddressExplainerModal, copyAddressToClipboard])

  const onPressHiddenStatus = useCallback(() => {
    /**
     * This update changes the parameters sent in the call to `portfolios`,
     * resulting in a full reload of the portfolio from the server.
     * To avoid the empty state while fetching the new portfolio, we manually
     * modify the current one in the cache.
     */

    updateCache(isVisible, portfolioBalance ?? undefined)

    sendAnalyticsEvent(WalletEventName.TokenVisibilityChanged, {
      currencyId,
      // we log the state to which it's transitioning
      visible: !isVisible,
    })
    dispatch(setTokenVisibility({ currencyId: normalizeCurrencyIdForMapLookup(currencyId), isVisible: !isVisible }))

    if (tokenSymbolForNotification) {
      dispatch(
        pushNotification({
          type: AppNotificationType.AssetVisibility,
          visible: isVisible,
          hideDelay: 2 * ONE_SECOND_MS,
          assetName: t('walletConnect.request.details.label.token'),
        }),
      )
    }
  }, [updateCache, isVisible, portfolioBalance, currencyId, dispatch, tokenSymbolForNotification, t])

  const menuActions: MenuOptionItemWithId[] = useMemo(() => {
    const actions: MenuOptionItemWithId[] = [
      {
        id: TokenMenuActionType.Swap,
        label: t('common.button.swap'),
        disabled: isBlocked,
        onPress: () => onPressSwap(CurrencyField.INPUT),
        Icon: CoinConvert,
      },
    ]

    const isSolanaToken = currencyIdToChain(currencyId) === UniverseChainId.Solana

    // Only add Send action for non-Solana tokens
    if (!isSolanaToken) {
      actions.push({
        id: TokenMenuActionType.Send,
        label: t('common.button.send'),
        onPress: onPressSend,
        Icon: SendAction,
      })
    }

    actions.push({
      id: TokenMenuActionType.Receive,
      label: t('common.button.receive'),
      onPress: navigateToReceive,
      Icon: ReceiveAlt,
    })

    if (!isTestnetModeEnabled && copyAddressToClipboard && !isNative) {
      actions.push({
        id: TokenMenuActionType.CopyAddress,
        label: t('common.copy.address'),
        onPress: onPressCopyAddress,
        Icon: CopySheets,
      })
    }

    if (!isWebPlatform) {
      actions.push({
        id: TokenMenuActionType.Share,
        label: t('common.button.share'),
        onPress: onPressShare,
        Icon: ShareArrow,
      })
    }

    if (isExtensionApp && !isTestnetModeEnabled) {
      actions.push({
        id: TokenMenuActionType.ViewDetails,
        label: t('common.button.viewDetails'),
        onPress: onPressViewDetails,
        Icon: ExternalLink,
      })
    }

    if (activeAccountHoldsToken && !isTestnetModeEnabled) {
      actions.push({
        id: TokenMenuActionType.ToggleVisibility,
        label: isVisible ? t('tokens.action.hide') : t('tokens.action.unhide'),
        onPress: onPressHiddenStatus,
        Icon: isVisible ? EyeOff : Eye,
      })
    }

    if (isDataReportingEnabled && openReportDataIssueModal) {
      actions.push({
        id: TokenMenuActionType.DataIssue,
        label: t('reporting.token.data.title'),
        onPress: openReportDataIssueModal,
        Icon: ChartBarCrossed,
      })
    }

    if (isDataReportingEnabled && !isNative) {
      actions.push({
        id: TokenMenuActionType.ReportToken,
        label: t('reporting.token.report.title'),
        onPress: openReportTokenModal,
        Icon: Flag,
        destructive: true,
      })
    }

    if (excludedActions) {
      const excludedActionIds = excludedActions.map((action) => action.toString())
      const filteredActions: MenuOptionItemWithId[] = actions.filter(
        (action: MenuOptionItemWithId) => !excludedActionIds.includes(action.id),
      )
      return filteredActions
    } else {
      return actions
    }
  }, [
    currencyId,
    t,
    isBlocked,
    onPressSend,
    navigateToReceive,
    onPressShare,
    onPressViewDetails,
    activeAccountHoldsToken,
    isVisible,
    onPressHiddenStatus,
    onPressCopyAddress,
    onPressSwap,
    excludedActions,
    isTestnetModeEnabled,
    isNative,
    copyAddressToClipboard,
    openReportTokenModal,
    openReportDataIssueModal,
    isDataReportingEnabled,
  ])

  return menuActions
}
