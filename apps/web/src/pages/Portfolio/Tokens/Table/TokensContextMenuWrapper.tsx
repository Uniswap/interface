import { Currency } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenBalanceItemContextMenu } from 'uniswap/src/components/portfolio/TokenBalanceItemContextMenu'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { TokenMenuActionType } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { useEvent } from 'utilities/src/react/hooks'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { popupRegistry } from '~/components/Popups/registry'
import { PopupType } from '~/components/Popups/types'
import { useModalState } from '~/hooks/useModalState'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { useNavigateToTokenDetails } from '~/pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'
import { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'

export function TokensContextMenuWrapper({
  tokenData,
  triggerMode,
  children,
}: PropsWithChildren<{ tokenData: TokenData; triggerMode?: ContextMenuTriggerMode }>): React.ReactNode {
  const { t } = useTranslation()
  const showDemoView = useShowDemoView()
  const { isExternalWallet, externalAddress } = usePortfolioRoutes()

  const { openModal } = useModalState(ModalName.ReportTokenIssue)
  const [, setModalProps] = useAtom(ReportTokenIssueModalPropsAtom)

  const portfolioBalance: PortfolioBalance | undefined = useMemo(() => {
    if (!tokenData.currencyInfo) {
      return undefined
    }

    return {
      id: tokenData.id,
      cacheId: tokenData.id,
      quantity: tokenData.balance.value,
      balanceUSD: tokenData.value,
      currencyInfo: tokenData.currencyInfo,
      relativeChange24: tokenData.change1d,
      isHidden: tokenData.isHidden ?? false,
    }
  }, [
    tokenData.currencyInfo,
    tokenData.id,
    tokenData.balance.value,
    tokenData.change1d,
    tokenData.value,
    tokenData.isHidden,
  ])

  const openReportTokenModal = useEvent((currency: Currency) => {
    setModalProps({ source: 'portfolio', currency, isMarkedSpam: portfolioBalance?.currencyInfo.isSpam })
    openModal()
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
    if (portfolioBalance) {
      openReportTokenModal(portfolioBalance.currencyInfo.currency)
    }
  }, [portfolioBalance, openReportTokenModal])

  // When viewing external wallet, exclude hide and report options from context menu
  const excludedActions = useMemo(() => {
    if (isExternalWallet) {
      return [TokenMenuActionType.ToggleVisibility, TokenMenuActionType.ReportToken]
    }
    return undefined
  }, [isExternalWallet])

  // Context menu not available in demo view or when no portfolio balance
  if (!portfolioBalance || showDemoView) {
    return children
  }

  return (
    <TokenBalanceItemContextMenu
      portfolioBalance={portfolioBalance}
      triggerMode={triggerMode}
      excludedActions={excludedActions}
      openReportTokenModal={openReportTokenModalForCurrency}
      copyAddressToClipboard={copyAddressToClipboard}
      onPressToken={() => navigateToTokenDetails(tokenData.currencyInfo?.currency)}
      disableNotifications={true}
      recipient={isExternalWallet ? externalAddress?.address : undefined}
    >
      {children}
    </TokenBalanceItemContextMenu>
  )
}
