import { Currency } from '@uniswap/sdk-core'
import { memo } from 'react'
import { Flex } from 'ui/src'
import {
  CONTEXT_MENU_ACTIONS,
  TokenContextMenuVariant,
} from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import { TokenOptionItemContextMenu } from 'uniswap/src/components/lists/items/tokens/TokenOptionItemContextMenu'
import { ContextMenuTriggerButton } from 'uniswap/src/components/menus/ContextMenuTriggerButton'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useDelayedMenuClose } from 'uniswap/src/features/search/SearchModal/hooks/useDelayedMenuClose'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

// Context menu button component that manages its own state
export const TokenRowContextMenuButton = memo(function TokenRowContextMenuButton({
  currency,
  isVisible = true,
}: {
  currency: Currency
  isVisible?: boolean
}): JSX.Element {
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)
  useDelayedMenuClose({ isVisible, isOpen, closeMenu })

  const shouldShow = isVisible || isOpen

  return (
    <Flex opacity={shouldShow ? 1 : 0} pointerEvents={shouldShow ? 'auto' : 'none'}>
      <TokenOptionItemContextMenu
        actions={CONTEXT_MENU_ACTIONS[TokenContextMenuVariant.Search]}
        triggerMode={ContextMenuTriggerMode.Primary}
        currency={currency}
        isOpen={isOpen}
        openMenu={openMenu}
        closeMenu={closeMenu}
      >
        <ContextMenuTriggerButton />
      </TokenOptionItemContextMenu>
    </Flex>
  )
})
