import { PropsWithChildren, useCallback, useMemo } from 'react'
import { TouchableArea } from 'ui/src'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenBalanceItemContextMenuProps } from 'uniswap/src/components/portfolio/TokenBalanceItemContextMenu'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { useTokenContextMenuOptions } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { isExtension, isInterface } from 'utilities/src/platform'
import { noop } from 'utilities/src/react/noop'
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
  const { hapticFeedback } = useHapticFeedback()

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

  const openMenuWithHaptics = useCallback(async () => {
    await hapticFeedback.light().catch(noop)
    openMenu()
  }, [hapticFeedback, openMenu])

  const actionableItem = useMemo(() => {
    if (isInterface) {
      return (
        // eslint-disable-next-line react/forbid-elements
        <div style={{ cursor: 'pointer' }} onContextMenu={openMenu}>
          <TouchableArea onPress={onPressToken}>{children}</TouchableArea>
        </div>
      )
    } else {
      return (
        <TouchableArea
          onPress={isExtension ? openMenu : onPressToken}
          onLongPress={isExtension ? undefined : openMenuWithHaptics}
        >
          {children}
        </TouchableArea>
      )
    }
  }, [children, onPressToken, openMenu, openMenuWithHaptics])

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
