import { isExtensionApp } from '@universe/environment'
import { memo, PropsWithChildren, useCallback, useMemo } from 'react'
import { TouchableArea } from 'ui/src'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenBalanceItemContextMenuProps } from 'uniswap/src/components/portfolio/TokenBalanceItem/TokenBalanceItemContextMenu'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { useTokenContextMenuOptions } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export const TokenBalanceItemContextMenu = memo(function TokenBalanceItemContextMenu({
  children,
  portfolioBalance,
  isMultichainAsset,
  excludedActions,
  openContractAddressExplainerModal,
  openReportTokenModal,
  openReportDataIssueModal,
  copyAddressToClipboard,
  triggerMode,
  onPressToken,
  disableNotifications,
  recipient,
}: PropsWithChildren<TokenBalanceItemContextMenuProps>): JSX.Element {
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu, toggle } = useBooleanState(false)
  // Default (undefined): extension uses primary click for the menu; web uses secondary (right-click).
  // Explicit Secondary must win in the extension so rows can use primary press for another action (e.g. expand).
  const isPrimaryTriggerMode =
    triggerMode === ContextMenuTriggerMode.Primary
      ? true
      : triggerMode === ContextMenuTriggerMode.Secondary
        ? false
        : isExtensionApp

  const menuActions = useTokenContextMenuOptions({
    excludedActions,
    currencyId: portfolioBalance.currencyInfo.currencyId,
    isBlocked: portfolioBalance.currencyInfo.safetyInfo?.tokenList === TokenList.Blocked,
    tokenSymbolForNotification: portfolioBalance.currencyInfo.currency.symbol,
    portfolioBalance,
    isMultichainAsset,
    openContractAddressExplainerModal,
    openReportTokenModal,
    openReportDataIssueModal,
    copyAddressToClipboard,
    closeMenu,
    disableNotifications,
    recipient,
  })

  const ignoreDefault = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  /** Suppress the native context menu but allow the event to reach {@link ContextMenu}'s trigger (secondary mode). */
  const preventDefaultContextMenuOnly = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const actionableItem = useMemo(() => {
    const onInnerContextMenu = isExtensionApp
      ? isPrimaryTriggerMode
        ? ignoreDefault
        : preventDefaultContextMenuOnly
      : toggle

    return (
      // oxlint-disable-next-line react/forbid-elements -- needed here
      <div style={{ cursor: 'pointer' }} onContextMenu={onInnerContextMenu}>
        <TouchableArea
          onPressIn={(e) => e.stopPropagation()}
          onPressOut={(e) => e.stopPropagation()}
          onPress={isPrimaryTriggerMode ? toggle : onPressToken}
        >
          {children}
        </TouchableArea>
      </div>
    )
  }, [children, ignoreDefault, isPrimaryTriggerMode, onPressToken, preventDefaultContextMenuOnly, toggle])
  return (
    <ContextMenu
      trackItemClicks
      menuItems={menuActions}
      triggerMode={isPrimaryTriggerMode ? ContextMenuTriggerMode.Primary : ContextMenuTriggerMode.Secondary}
      isOpen={isOpen}
      openMenu={openMenu}
      closeMenu={closeMenu}
      elementName={ElementName.PortfolioTokenContextMenu}
      sectionName={SectionName.PortfolioTokensTab}
    >
      {actionableItem}
    </ContextMenu>
  )
})
