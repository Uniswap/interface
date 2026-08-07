/**
 * Web-only, drop-in replacement for the legacy `MenuContent`
 * (`uniswap/src/components/menus/ContextMenuContent.tsx`), INFRA-3021.
 * Renders the menu card (parity-diffed by the container matrix) and the item
 * vocabulary. Works in two hosts, exactly like the legacy component:
 *  - inside `ContextMenuCompat`: items compose Base UI `Menu.Item` (real
 *    menuitem semantics + keyboard navigation — the ledgered a11y upgrade);
 *  - standalone (contentOverride/card consumers): plain items with the
 *    legacy `role="none"` shape, no Base UI context required.
 *
 * Analytics stay host-side: item clicks report through the telemetry
 * adapter seam when `trackItemClicks` is set (see MenuTelemetryAdapter).
 */
// oxlint-disable react/forbid-elements -- the compat components ARE the raw DOM boundary (no Tamagui Flex here)
import * as React from 'react'
import { DropdownMenuItem } from '../shadcn/dropdown-menu'
import { menuContentContainerClassName, menuSeparatorClassName, resolveMenuColor } from './compile'
import { DropdownMenuSheetItemCompat } from './DropdownMenuSheetItemCompat'
import { getMenuItemColorCompat, type MenuContentCompatProps, type MenuOptionItemCompat } from './types'

/** Provided by ContextMenuCompat while rendering inside a Base UI menu root. */
export const MenuCompatHostContext = React.createContext<{ insideMenu: boolean }>({ insideMenu: false })

const ICON_SIZE_WEB = 16

function stopPropagation(event: React.SyntheticEvent): void {
  event.stopPropagation()
}

function preventAndStop(event: React.SyntheticEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

function renderItemIcon(item: MenuOptionItemCompat): React.ReactNode {
  const { Icon, iconColor, destructive, disabled } = item
  if (Icon === undefined) {
    return undefined
  }
  const color = getMenuItemColorCompat({ overrideColor: iconColor, destructive, disabled })
  const IconComponent = Icon as React.ComponentType<{ size?: number; color?: string }>
  return <IconComponent size={ICON_SIZE_WEB} color={resolveMenuColor(color)} />
}

export function MenuContentCompat({
  items,
  handleCloseMenu,
  elementName,
  sectionName,
  trackItemClicks = false,
  containerStyles,
  telemetryAdapter,
}: MenuContentCompatProps): React.JSX.Element {
  const { insideMenu } = React.useContext(MenuCompatHostContext)

  const wrapItemPress = (item: MenuOptionItemCompat, index: number): (() => void) => {
    if (!trackItemClicks) {
      return item.onPress
    }
    return (): void => {
      telemetryAdapter?.onMenuItemClicked?.({ elementName, sectionName, label: item.label, index })
      item.onPress()
    }
  }

  return (
    // The legacy wrapper swallows right-clicks and click/mousedown bubbling.
    // oxlint-disable-next-line react/forbid-elements -- verbatim port of the legacy propagation-stopper div
    <div
      data-slot="menu-content-compat"
      onContextMenu={preventAndStop}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
    >
      <div className={menuContentContainerClassName(containerStyles)}>
        {items.map((item, index) => {
          const {
            Icon: _icon,
            iconColor: _iconColor,
            showDivider,
            onPress: _onPress,
            trailingIcon,
            label,
            ...itemProps
          } = item
          const element = (
            <DropdownMenuSheetItemCompat
              allowMultiline
              // Standalone keeps the legacy web role shape; inside a menu the
              // key is omitted so Base UI Menu.Item's injected role="menuitem"
              // wins (a11y upgrade).
              {...(insideMenu ? {} : { role: 'none' })}
              variant="small"
              icon={renderItemIcon(item)}
              label={label}
              rightElement={trailingIcon}
              {...itemProps}
              handleCloseMenu={handleCloseMenu}
              onPress={wrapItemPress(item, index)}
            />
          )
          return (
            <React.Fragment key={index}>
              {showDivider === true && (
                <div role="separator" data-slot="menu-separator-compat" className={menuSeparatorClassName()} />
              )}
              {insideMenu ? (
                <DropdownMenuItem unstyled closeOnClick={false} disabled={item.disabled} render={element} />
              ) : (
                element
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
