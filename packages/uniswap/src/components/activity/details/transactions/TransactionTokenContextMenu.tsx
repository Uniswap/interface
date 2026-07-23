import { isWebPlatform } from '@universe/environment'
import { PropsWithChildren, useMemo } from 'react'
import { TouchableArea } from 'ui/src'
import { ContextMenu, MenuOptionItemWithId } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import {
  TokenMenuActionType,
  useTokenContextMenuOptions,
} from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { noop } from 'utilities/src/react/noop'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const NAVIGATION_ACTIONS = new Set<TokenMenuActionType>([
  TokenMenuActionType.Swap,
  TokenMenuActionType.Send,
  TokenMenuActionType.Receive,
  TokenMenuActionType.ViewDetails,
])

function withNavigationActionCallback(
  menuItems: MenuOptionItemWithId[],
  onNavigationActionPress: () => void,
): MenuOptionItemWithId[] {
  return menuItems.map((item) => {
    if (!NAVIGATION_ACTIONS.has(item.id as TokenMenuActionType)) {
      return item
    }
    const originalOnPress = item.onPress
    return {
      ...item,
      onPress: () => {
        originalOnPress()
        onNavigationActionPress()
      },
    }
  })
}

export interface TransactionTokenContextMenuProps {
  currencyInfo: Maybe<CurrencyInfo>
  offsetX?: number
  disabled?: boolean
  onClose?: () => void
}

export function TransactionTokenContextMenu({
  currencyInfo,
  children,
  offsetX,
  disabled,
  onClose,
}: PropsWithChildren<TransactionTokenContextMenuProps>): JSX.Element {
  if (!currencyInfo) {
    return <>{children}</>
  }

  return (
    <TransactionTokenContextMenuContent
      currencyInfo={currencyInfo}
      offsetX={offsetX}
      disabled={disabled}
      onClose={onClose}
    >
      {children}
    </TransactionTokenContextMenuContent>
  )
}

function TransactionTokenContextMenuContent({
  currencyInfo,
  children,
  offsetX,
  disabled,
  onClose,
}: PropsWithChildren<{
  currencyInfo: CurrencyInfo
  offsetX?: number
  disabled?: boolean
  onClose?: () => void
}>): JSX.Element {
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)

  const defaultMenuItems = useTokenContextMenuOptions({
    currencyId: currencyInfo.currencyId,
    isBlocked: currencyInfo.safetyInfo?.tokenList === TokenList.Blocked,
    excludedActions: [
      TokenMenuActionType.CopyAddress,
      TokenMenuActionType.Share,
      TokenMenuActionType.ToggleVisibility,
      TokenMenuActionType.DataIssue,
      TokenMenuActionType.ReportToken,
    ],
    openReportTokenModal: noop,
    analyticsSection: SectionName.TransactionDetails,
    closeMenu,
  })

  const menuItems = useMemo(
    () => withNavigationActionCallback(defaultMenuItems, onClose ?? noop),
    [defaultMenuItems, onClose],
  )

  return (
    <ContextMenu
      trackItemClicks
      isPlacementRight
      disabled={disabled}
      menuItems={menuItems}
      offsetX={offsetX}
      triggerMode={ContextMenuTriggerMode.Primary}
      isOpen={isOpen}
      openMenu={openMenu}
      closeMenu={closeMenu}
      elementName={ElementName.TokenItem}
    >
      {isWebPlatform ? <TouchableArea>{children}</TouchableArea> : children}
    </ContextMenu>
  )
}
