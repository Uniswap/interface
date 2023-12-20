import React, { memo, useMemo } from 'react'
import ContextMenu from 'react-native-context-menu-view'
import { useTokenContextMenu } from 'src/features/balances/hooks'
import { borderRadii } from 'ui/src/theme'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'

export const TokenBalanceItemContextMenu = memo(function _TokenBalanceItem({
  portfolioBalance,
  children,
}: {
  portfolioBalance: PortfolioBalance
  children: React.ReactNode
}) {
  const { currencyInfo, balanceUSD } = portfolioBalance
  const { currency, currencyId, isSpam } = currencyInfo

  const { menuActions, onContextMenuPress } = useTokenContextMenu({
    currencyId,
    isSpam,
    balanceUSD,
    isNative: currency.isNative,
    accountHoldsToken: true,
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
