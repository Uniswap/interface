import { Currency } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenBalanceItemContextMenu } from 'uniswap/src/components/portfolio/TokenBalanceItem/TokenBalanceItemContextMenu'
import { ReportTokenDataModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenDataModal'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { TokenMenuActionType } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TdpChainSelectionType } from 'uniswap/src/utils/linking'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { useEvent } from 'utilities/src/react/hooks'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { useModalState } from '~/hooks/useModalState'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { useNavigateToTokenDetails } from '~/pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'
import { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokensMultichainParentContextMenu } from '~/pages/Portfolio/Tokens/Table/TokensMultichainParentContextMenu'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

/** Multichain aggregate row: per-chain actions only on child rows (hide, reports, data issue). */
const MULTICHAIN_PARENT_MENU_EXCLUDED_ACTIONS: TokenMenuActionType[] = [
  TokenMenuActionType.ToggleVisibility,
  TokenMenuActionType.ReportToken,
  TokenMenuActionType.DataIssue,
]

/** Union multichain-parent exclusions with wallet-context exclusions (e.g. external wallet). */
function mergeMultichainParentExcludedActions(
  walletContextExcluded: TokenMenuActionType[] | undefined,
): TokenMenuActionType[] {
  return [...new Set([...MULTICHAIN_PARENT_MENU_EXCLUDED_ACTIONS, ...(walletContextExcluded ?? [])])]
}

export function TokensContextMenuWrapper({
  tokenData,
  triggerMode,
  children,
}: PropsWithChildren<{
  tokenData: TokenData
  triggerMode?: ContextMenuTriggerMode
}>): React.ReactNode {
  const { t } = useTranslation()
  const showDemoView = useShowDemoView()
  const { isExternalWallet, externalAddress } = usePortfolioRoutes()

  const { openModal } = useModalState(ModalName.ReportTokenIssue)
  const [, setModalProps] = useAtom(ReportTokenIssueModalPropsAtom)

  const { openModal: openDataIssueModal } = useModalState(ModalName.ReportTokenData)
  const [, setDataIssueModalProps] = useAtom(ReportTokenDataModalPropsAtom)

  const portfolioBalance: PortfolioBalance = useMemo(() => {
    const chainToken = tokenData.tokens[0]
    return {
      id: tokenData.id,
      cacheId: tokenData.id,
      quantity: tokenData.quantity,
      balanceUSD: tokenData.totalValue,
      currencyInfo: tokenData.currencyInfo,
      relativeChange24: tokenData.change1d,
      // oxlint-disable-next-line no-unnecessary-condition -- for safety
      isHidden: chainToken?.isHidden ?? false,
    }
  }, [tokenData])

  const openReportTokenModal = useEvent((currency: Currency) => {
    setModalProps({
      source: 'portfolio',
      currency,
      isMarkedSpam: portfolioBalance.currencyInfo.isSpam,
      isMultichainAsset: tokenData.isMultichainAsset,
    })
    openModal()
  })

  const openReportDataIssueModalWithCurrency = useEvent((currency: Currency) => {
    setDataIssueModalProps({ currency, isMarkedSpam: portfolioBalance.currencyInfo.isSpam })
    openDataIssueModal()
  })

  const copyAddressToClipboard = useCallback(
    async (address: string): Promise<void> => {
      await setClipboard(address)
      popupRegistry.addPopup(
        { type: PopupType.Success, message: t('notification.copied.address') },
        `copy-token-address-${address}`,
        POPUP_MEDIUM_DISMISS_MS,
      )
    },
    [t],
  )

  const navigateToTokenDetails = useNavigateToTokenDetails()

  const openReportTokenModalForCurrency = useCallback(() => {
    openReportTokenModal(portfolioBalance.currencyInfo.currency)
  }, [portfolioBalance, openReportTokenModal])

  const openReportDataIssueModalForCurrency = useCallback(() => {
    openReportDataIssueModalWithCurrency(portfolioBalance.currencyInfo.currency)
  }, [portfolioBalance, openReportDataIssueModalWithCurrency])

  // When viewing external wallet, exclude hide and report options from context menu
  const excludedActions = useMemo(() => {
    if (isExternalWallet) {
      return [TokenMenuActionType.ToggleVisibility, TokenMenuActionType.ReportToken]
    }
    return undefined
  }, [isExternalWallet])

  const multichainParentExcludedActions = useMemo(
    () => mergeMultichainParentExcludedActions(excludedActions),
    [excludedActions],
  )

  // Context menu not available in demo view
  if (showDemoView) {
    return children
  }

  if (tokenData.tokens.length > 1) {
    return (
      <TokensMultichainParentContextMenu
        portfolioBalance={portfolioBalance}
        tokenCurrencyInfos={tokenData.tokens.map((row) => row.currencyInfo)}
        triggerMode={triggerMode}
        excludedActions={multichainParentExcludedActions}
        openReportTokenModal={openReportTokenModalForCurrency}
        openReportDataIssueModal={undefined}
        copyAddressToClipboard={copyAddressToClipboard}
        onPressToken={() =>
          navigateToTokenDetails(tokenData.currencyInfo.currency, {
            type: TdpChainSelectionType.Chain,
            chainId: tokenData.chainId,
          })
        }
        disableNotifications={true}
        recipient={isExternalWallet ? externalAddress?.address : undefined}
      >
        {children}
      </TokensMultichainParentContextMenu>
    )
  }

  return (
    <TokenBalanceItemContextMenu
      portfolioBalance={portfolioBalance}
      isMultichainAsset={tokenData.isMultichainAsset}
      triggerMode={triggerMode}
      excludedActions={excludedActions}
      openReportTokenModal={openReportTokenModalForCurrency}
      openReportDataIssueModal={openReportDataIssueModalForCurrency}
      copyAddressToClipboard={copyAddressToClipboard}
      onPressToken={() =>
        navigateToTokenDetails(tokenData.currencyInfo.currency, {
          type: TdpChainSelectionType.Chain,
          chainId: tokenData.chainId,
        })
      }
      disableNotifications={true}
      recipient={isExternalWallet ? externalAddress?.address : undefined}
    >
      {children}
    </TokenBalanceItemContextMenu>
  )
}
