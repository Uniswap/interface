import { Currency } from '@uniswap/sdk-core'
import { useModalState } from 'hooks/useModalState'
import { useAtom } from 'jotai'
import useIsConnected from 'pages/Portfolio/Header/hooks/useIsConnected'
import { useNavigateToTokenDetails } from 'pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenBalanceItemContextMenu } from 'uniswap/src/components/portfolio/TokenBalanceItemContextMenu'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { useEvent } from 'utilities/src/react/hooks'

export function TokensContextMenuWrapper({
  tokenData,
  triggerMode,
  children,
}: PropsWithChildren<{ tokenData: TokenData; triggerMode?: ContextMenuTriggerMode }>): React.ReactNode {
  const isConnected = useIsConnected()

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

  const copyAddressToClipboard = useCallback(async (address: string): Promise<void> => {
    await setClipboard(address)
  }, [])

  const navigateToTokenDetails = useNavigateToTokenDetails()

  const openReportTokenModalForCurrency = useCallback(() => {
    if (portfolioBalance) {
      openReportTokenModal(portfolioBalance.currencyInfo.currency)
    }
  }, [portfolioBalance, openReportTokenModal])

  if (!portfolioBalance || !isConnected) {
    return children
  }

  return (
    <TokenBalanceItemContextMenu
      portfolioBalance={portfolioBalance}
      triggerMode={triggerMode}
      openReportTokenModal={openReportTokenModalForCurrency}
      copyAddressToClipboard={copyAddressToClipboard}
      onPressToken={() => navigateToTokenDetails(tokenData)}
      disableNotifications={true}
    >
      {children}
    </TokenBalanceItemContextMenu>
  )
}
