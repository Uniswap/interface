import type { PropsWithChildren } from 'react'
import { useCallback, useMemo } from 'react'
import type { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import ContextMenu from 'react-native-context-menu-view'
import { TouchableArea } from 'ui/src'
import { borderRadii } from 'ui/src/theme'
import type { TokenBalanceItemContextMenuProps } from 'uniswap/src/components/portfolio/TokenBalanceItem/TokenBalanceItemContextMenu'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { useTokenContextMenuOptions } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'

// TODO merge into a single implementation once context menu performance is improved
export function TokenBalanceItemContextMenu({
  children,
  portfolioBalance,
  isMultichainAsset,
  excludedActions,
  openContractAddressExplainerModal,
  openReportTokenModal,
  copyAddressToClipboard,
  onPressToken,
  disableNotifications,
  recipient,
}: PropsWithChildren<TokenBalanceItemContextMenuProps>): JSX.Element {
  const menuActions = useTokenContextMenuOptions({
    excludedActions,
    currencyId: portfolioBalance.currencyInfo.currencyId,
    isBlocked: portfolioBalance.currencyInfo.safetyInfo?.tokenList === TokenList.Blocked,
    tokenSymbolForNotification: portfolioBalance.currencyInfo.currency.symbol,
    portfolioBalance,
    isMultichainAsset,
    openContractAddressExplainerModal,
    openReportTokenModal,
    copyAddressToClipboard,
    closeMenu: () => {},
    disableNotifications,
    recipient,
  })

  const actions = useMemo((): ContextMenuAction[] => {
    return menuActions.map((action) => ({
      title: action.label,
      systemIcon: actionToIcon[action.id],
    }))
  }, [menuActions])

  const onContextMenuPress = useCallback(
    (e: { nativeEvent: ContextMenuOnPressNativeEvent }): void => {
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
      menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions],
  )

  const style = useMemo(() => ({ borderRadius: borderRadii.rounded16 }), [])

  return (
    <ContextMenu actions={actions} disabled={menuActions.length === 0} style={style} onPress={onContextMenuPress}>
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
  reportToken: 'flag',
}
