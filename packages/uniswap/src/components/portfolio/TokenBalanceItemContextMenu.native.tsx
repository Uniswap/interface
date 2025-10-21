import { PropsWithChildren, useCallback, useMemo } from 'react'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { TouchableArea } from 'ui/src'
import { borderRadii } from 'ui/src/theme'
import { TokenBalanceItemContextMenuProps } from 'uniswap/src/components/portfolio/TokenBalanceItemContextMenu'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { useTokenContextMenuOptions } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'

// TODO merge into a single implementation once context menu performance is improved
export function TokenBalanceItemContextMenu({
  children,
  portfolioBalance,
  excludedActions,
  openContractAddressExplainerModal,
  copyAddressToClipboard,
  onPressToken: onPressToken,
}: PropsWithChildren<TokenBalanceItemContextMenuProps>): JSX.Element {
  const menuActions = useTokenContextMenuOptions({
    excludedActions,
    currencyId: portfolioBalance.currencyInfo.currencyId,
    isBlocked: portfolioBalance.currencyInfo.safetyInfo?.tokenList === TokenList.Blocked,
    tokenSymbolForNotification: portfolioBalance.currencyInfo.currency.symbol,
    portfolioBalance,
    openContractAddressExplainerModal,
    copyAddressToClipboard,
    closeMenu: () => {},
  })

  const onContextMenuPress = useCallback(
    (e: { nativeEvent: ContextMenuOnPressNativeEvent }): void => {
      menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions],
  )

  const style = useMemo(() => ({ borderRadius: borderRadii.rounded16 }), [])

  return (
    <ContextMenu
      actions={menuActions.map((action) => ({
        title: action.label,
        onPress: action.onPress,
        systemIcon: actionToIcon[action.id],
      }))}
      disabled={menuActions.length === 0}
      style={style}
      onPress={onContextMenuPress}
    >
      <TouchableArea onPress={onPressToken}>{children}</TouchableArea>
    </ContextMenu>
  )
}

const actionToIcon: Record<string, string> = {
  swap: 'rectangle.2.swap',
  send: 'paperplane',
  receive: 'qrcode',
  share: 'square.and.arrow.up',
  toggleVisibility: 'eye',
  copyAddress: 'doc.on.doc',
}
