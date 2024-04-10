import React, { memo, useMemo } from 'react'
import ContextMenu from 'react-native-context-menu-view'
import { borderRadii } from 'ui/src/theme'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useTokenContextMenu } from 'wallet/src/features/portfolio/useTokenContextMenu'

export const TokenBalanceItemContextMenu = memo(function _TokenBalanceItem({
  portfolioBalance,
  children,
}: {
  portfolioBalance: PortfolioBalance
  children: React.ReactNode
}) {
  const { menuActions, onContextMenuPress } = useTokenContextMenu({
    currencyId: portfolioBalance.currencyInfo.currencyId,
    portfolioBalance,
  })

  const style = useMemo(() => ({ borderRadius: borderRadii.rounded16 }), [])

  return (
    <ContextMenu
      actions={menuActions}
      disabled={menuActions.length === 0}
      style={style}
      onPress={onContextMenuPress}>
      {children}
    </ContextMenu>
  )
})
