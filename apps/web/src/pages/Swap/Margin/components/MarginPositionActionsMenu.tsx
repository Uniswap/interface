import { Flex, TouchableArea } from '@universe/mycelium'
import { useIsTouchDevice } from '@universe/mycelium'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { iconSizes } from 'ui/src/theme'
import { ContextMenu, type MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import type { MarginPosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import type { MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useMarginRowMenu } from '~/pages/Swap/Margin/hooks/marginRowMenuStore'
import { useMarginPositionActions } from '~/pages/Swap/Margin/hooks/useMarginPositionActions'

// RemoveScroll is active while the menu is open, so a menu taller than the viewport cannot be
// scrolled to. Five single-line subheaders come to ~260px; this only binds on a very short viewport.
const MENU_MAX_HEIGHT = 420

// The per-row `…` trigger. Open state lives in a module store, NOT in props from the table — see
// marginRowMenuStore for why that distinction is load-bearing.
export const MarginPositionActionsMenu = memo(function MarginPositionActionsMenu({
  position,
  mountKey,
  onSelect,
}: {
  position: MarginPosition
  // Which MOUNT this is — deliberately not called `surface`, which one line down means the analytics
  // surface the hook reports ('menu'). The table cell and the expanded drawer can both render a menu for
  // the SAME position on a touch device, and the open-state store is keyed by this pair; without it they
  // would share a key and one tap would open both popovers.
  mountKey: 'row' | 'drawer'
  onSelect: (request: { action: MarginManageAction; positionId: string }) => void
}): JSX.Element {
  const { t } = useTranslation()
  const isTouchDevice = useIsTouchDevice()
  const actions = useMarginPositionActions({ position, onSelect, surface: 'menu' })
  // MarginActionItem carries `action`/`tooltipBody` for the drawer surface; neither is a MenuOptionItem
  // field, and ContextMenu spreads unknown item props onto the DOM row — a stray `action` trips React's
  // "only <form> accepts the action prop" error. Pass only the menu fields through.
  const menuItems = useMemo<MenuOptionItem[]>(() => actions.map(({ action, tooltipBody, ...item }) => item), [actions])
  const { isOpen, setOpen } = useMarginRowMenu(`${mountKey}:${position.positionId}`)

  const openMenu = useEvent(() => setOpen(true))
  const closeMenu = useEvent(() => setOpen(false))
  const toggle = useEvent(() => setOpen(!isOpen))

  // On web Tamagui maps onPressIn->mousedown, onPressOut->mouseup, onPress->click, and the row itself
  // is a TouchableArea whose onPress toggles expansion. Stopping all three keeps the row out of it.
  //
  // Stopping onPressIn is what makes this work at all: that same mousedown is what ContextMenu's
  // Popover.Trigger opens on, and opening there leaves a window between mousedown and mouseup in
  // which the DOM can move under the cursor — the browser then dispatches `click` at the nearest
  // common ancestor (the row) instead of the trigger. A real mouse holds the button long enough to
  // hit that window; a synthetic click never does, which is exactly why this reproduced by hand and
  // not under automation. Owning the toggle on `click` removes the window entirely.
  const stopPress = useEvent((e: { stopPropagation: () => void }) => e.stopPropagation())
  const onPressTrigger = useEvent((e: { stopPropagation: () => void; preventDefault: () => void }) => {
    e.stopPropagation()
    e.preventDefault()
    toggle()
  })

  return (
    // No placement/z-index/portal props: ContextMenu derives bottom-end by default (the menu grows
    // leftward, away from the viewport edge) and passes allowFlip unconditionally.
    <ContextMenu
      trackItemClicks
      menuItems={menuItems}
      menuContentStyles={{ maxHeight: MENU_MAX_HEIGHT, overflow: 'scroll' }}
      triggerMode={ContextMenuTriggerMode.Primary}
      isOpen={isOpen}
      openMenu={openMenu}
      closeMenu={closeMenu}
      offsetY={4}
      elementName={ElementName.MarginPositionContextMenu}
      sectionName={SectionName.MarginPositionsTable}
    >
      {/* oxlint-disable-next-line react/forbid-elements -- raw div needed for onContextMenu */}
      <div style={{ cursor: 'pointer' }} onContextMenu={toggle}>
        {/* Reveal binds to the row-level `group` marker on MarginPositionsTable's renderDrawerRow
            wrapper, so it appears on ROW hover — not the inner TouchableArea (its own group) which
            would only reveal over its 28px box. Always visible on touch (no hover) and while open (or
            it vanishes as the pointer travels to the popover). Instant, not animated. */}
        <Flex
          className={`${isTouchDevice || isOpen ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 focus-within:opacity-100`}
        >
          {/* aria-label on the FOCUSABLE element, not a child Flex — same convention as the amount
              field's chip and MAX affordances. */}
          <TouchableArea
            aria-label={t('margin.table.positionActions')}
            onPressIn={stopPress}
            onPressOut={stopPress}
            onPress={onPressTrigger}
          >
            {/* NOT ContextMenuTriggerButton: it is a TouchableArea on web, and nesting pressables
                here confuses the press path. This is its content, minus the inner pressable. */}
            <Flex
              centered
              height={iconSizes.icon28}
              width={iconSizes.icon28}
              borderRadius="$rounded12"
              hoverStyle={{ backgroundColor: '$surface3' }}
            >
              <MoreHorizontal size={iconSizes.icon16} color="$neutral2" />
            </Flex>
          </TouchableArea>
        </Flex>
      </div>
    </ContextMenu>
  )
})
