import { PropsWithChildren, useCallback, useMemo } from 'react'
import { TouchableArea } from 'ui/src'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenBalanceItemContextMenuProps } from 'uniswap/src/components/portfolio/TokenBalanceItemContextMenu'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { useTokenContextMenuOptions } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { isExtension } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function TokenBalanceItemContextMenu({
  children,
  portfolioBalance,
  excludedActions,
  openContractAddressExplainerModal,
  copyAddressToClipboard,
  onPressToken: onPressToken,
}: PropsWithChildren<TokenBalanceItemContextMenuProps>): JSX.Element {
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)

  const menuActions = useTokenContextMenuOptions({
    excludedActions,
    currencyId: portfolioBalance.currencyInfo.currencyId,
    isBlocked: portfolioBalance.currencyInfo.safetyInfo?.tokenList === TokenList.Blocked,
    tokenSymbolForNotification: portfolioBalance.currencyInfo.currency.symbol,
    portfolioBalance,
    openContractAddressExplainerModal,
    copyAddressToClipboard,
    closeMenu,
  })

  const ignoreDefault = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const actionableItem = useMemo(() => {
    return (
      // eslint-disable-next-line react/forbid-elements
      <div style={{ cursor: 'pointer' }} onContextMenu={isExtension ? ignoreDefault : openMenu}>
        <TouchableArea onPress={isExtension ? openMenu : onPressToken}>{children}</TouchableArea>
      </div>
    )
  }, [children, ignoreDefault, onPressToken, openMenu])

  return (
    <ContextMenu
      menuItems={menuActions}
      triggerMode={isExtension ? ContextMenuTriggerMode.Primary : ContextMenuTriggerMode.Secondary}
      isOpen={isOpen}
      closeMenu={closeMenu}
    >
      {actionableItem}
    </ContextMenu>
  )
}
