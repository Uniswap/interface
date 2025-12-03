import { memo, PropsWithChildren, useCallback, useMemo } from 'react'
import { TouchableArea } from 'ui/src'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenBalanceItemContextMenuProps } from 'uniswap/src/components/portfolio/TokenBalanceItemContextMenu'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { useTokenContextMenuOptions } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { isExtensionApp } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export const TokenBalanceItemContextMenu = memo(function TokenBalanceItemContextMenu({
  children,
  portfolioBalance,
  excludedActions,
  openContractAddressExplainerModal,
  openReportTokenModal,
  copyAddressToClipboard,
  triggerMode,
  onPressToken: onPressToken,
  disableNotifications,
}: PropsWithChildren<TokenBalanceItemContextMenuProps>): JSX.Element {
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)
  const isPrimaryTriggerMode = isExtensionApp || triggerMode === ContextMenuTriggerMode.Primary

  const menuActions = useTokenContextMenuOptions({
    excludedActions,
    currencyId: portfolioBalance.currencyInfo.currencyId,
    isBlocked: portfolioBalance.currencyInfo.safetyInfo?.tokenList === TokenList.Blocked,
    tokenSymbolForNotification: portfolioBalance.currencyInfo.currency.symbol,
    portfolioBalance,
    openContractAddressExplainerModal,
    openReportTokenModal,
    copyAddressToClipboard,
    closeMenu,
    disableNotifications,
  })

  const ignoreDefault = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const actionableItem = useMemo(() => {
    return (
      // biome-ignore  lint/correctness/noRestrictedElements: needed here
      <div style={{ cursor: 'pointer' }} onContextMenu={isExtensionApp ? ignoreDefault : openMenu}>
        <TouchableArea onPress={isPrimaryTriggerMode ? openMenu : onPressToken}>{children}</TouchableArea>
      </div>
    )
  }, [children, ignoreDefault, onPressToken, openMenu, isPrimaryTriggerMode])

  return (
    <ContextMenu
      trackItemClicks
      menuItems={menuActions}
      triggerMode={isPrimaryTriggerMode ? ContextMenuTriggerMode.Primary : ContextMenuTriggerMode.Secondary}
      isOpen={isOpen}
      closeMenu={closeMenu}
      elementName={ElementName.PortfolioTokenContextMenu}
      sectionName={SectionName.PortfolioTokensTab}
    >
      {actionableItem}
    </ContextMenu>
  )
})
