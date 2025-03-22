import React, { PropsWithChildren, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { borderRadii } from 'ui/src/theme'
import { PortfolioBalance, TokenList } from 'uniswap/src/features/dataApi/types'
import { useTokenContextMenu } from 'wallet/src/features/portfolio/useTokenContextMenu'

export const TokenBalanceItemContextMenu = memo(function _TokenBalanceItemContextMenu({
  portfolioBalance,
  children,
}: PropsWithChildren<{
  portfolioBalance: PortfolioBalance
}>) {
  const { t } = useTranslation()

  const { menuActions, onContextMenuPress } = useTokenContextMenu({
    currencyId: portfolioBalance.currencyInfo.currencyId,
    isBlocked: portfolioBalance.currencyInfo.safetyInfo?.tokenList === TokenList.Blocked,
    portfolioBalance,
    tokenSymbolForNotification: t('walletConnect.request.details.label.token'),
  })

  const style = useMemo(() => ({ borderRadius: borderRadii.rounded16 }), [])

  return (
    <ContextMenu actions={menuActions} disabled={menuActions.length === 0} style={style} onPress={onContextMenuPress}>
      {children}
    </ContextMenu>
  )
})
