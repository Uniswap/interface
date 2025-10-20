import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { PropsWithChildren, useMemo } from 'react'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenBalanceItemContextMenu } from 'uniswap/src/components/portfolio/TokenBalanceItemContextMenu'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'

export default function TokensContextMenuWrapper({
  tokenData,
  triggerMode,
  children,
}: PropsWithChildren<{ tokenData: TokenData; triggerMode?: ContextMenuTriggerMode }>): React.ReactNode {
  const portfolioBalance: PortfolioBalance | undefined = useMemo(() => {
    if (!tokenData.currencyInfo) {
      return undefined
    }

    return {
      id: tokenData.id,
      cacheId: tokenData.id,
      quantity: parseFloat(tokenData.balance.value),
      balanceUSD: tokenData.rawValue,
      currencyInfo: tokenData.currencyInfo,
      relativeChange24: tokenData.change1d,
      isHidden: false,
    }
  }, [tokenData.currencyInfo, tokenData.id, tokenData.balance.value, tokenData.change1d, tokenData.rawValue])

  if (!portfolioBalance) {
    return children
  }

  return (
    <TokenBalanceItemContextMenu portfolioBalance={portfolioBalance} triggerMode={triggerMode}>
      {children}
    </TokenBalanceItemContextMenu>
  )
}
