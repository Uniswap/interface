import { Currency } from '@uniswap/sdk-core'
import { isWebPlatform } from '@universe/environment'
import React, { ReactNode } from 'react'
import {
  TokenContextMenuAction,
  UseSearchTokenMenuItemsParams,
  useSearchTokenMenuItems,
} from 'uniswap/src/components/lists/items/tokens/useSearchTokenMenuItems'
import { ContextMenu, ContextMenuProps } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'

export { TokenContextMenuAction } from 'uniswap/src/components/lists/items/tokens/useSearchTokenMenuItems'

interface TokenOptionItemContextMenuProps {
  children: ReactNode
  currency: Currency
  isHiddenFromPortfolio?: boolean
  isOpen: boolean
  openMenu?: ContextMenuProps['openMenu']
  closeMenu: ContextMenuProps['closeMenu']
  triggerMode?: ContextMenuTriggerMode
  actions: TokenContextMenuAction[]
  copyAddressOverride?: UseSearchTokenMenuItemsParams['copyAddressOverride']
}

function TokenOptionItemContextMenuInner({
  children,
  currency,
  isOpen,
  openMenu,
  closeMenu,
  triggerMode = ContextMenuTriggerMode.Secondary,
  actions,
  copyAddressOverride,
}: TokenOptionItemContextMenuProps): JSX.Element {
  const { menuItems } = useSearchTokenMenuItems({ currency, closeMenu, actions, copyAddressOverride })

  return (
    <ContextMenu
      trackItemClicks
      menuItems={menuItems}
      triggerMode={triggerMode}
      isOpen={isOpen}
      closeMenu={closeMenu}
      openMenu={openMenu}
      offsetY={4}
      elementName={ElementName.SearchTokenContextMenu}
      sectionName={isWebPlatform ? SectionName.NavbarSearch : SectionName.ExploreSearch}
    >
      {children}
    </ContextMenu>
  )
}

export const TokenOptionItemContextMenu = React.memo(TokenOptionItemContextMenuInner)
