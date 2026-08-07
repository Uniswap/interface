/**
 * The menu-family compat prop contracts (INFRA-3021): drop-in types for the
 * legacy `ContextMenu` / `MenuOptionItem` (packages/uniswap) and
 * `MenuContent` / `DropdownMenuSheetItem` (packages/ui) surfaces, reproduced
 * without the Tamagui runtime. The parity suite in
 * `packages/tailwind/src/parity/menu` asserts key coverage and whole-type
 * assignability against the real legacy types.
 */
import type * as React from 'react'
import type { ColorValue } from '../compat/props'
import type { MenuContentContainerStyles } from './compile'

/**
 * The legacy token-typed color leaks (`IconProps['color']`,
 * `TextProps['color']`) include Tamagui-branded members (`Variable`,
 * `OpaqueColorValue`) that cannot be named without the Tamagui runtime, plus
 * `null`. The compat accepts the full union at the type level; at runtime
 * only string tokens / raw CSS colors resolve — anything else throws instead
 * of guessing (no production call site passes non-strings).
 */
export type MenuCompatColorValue = ColorValue | number | object | null

/**
 * Accepts any icon component the legacy `MenuOptionItem.Icon` union accepts
 * (`GeneratedIcon | ((props: IconProps) => JSX.Element)`): `never` props make
 * every component contravariantly assignable. Rendered with
 * `{ size, color }`, which is the subset the menu system drives.
 */
export type MenuCompatIconComponent = React.ComponentType<never> | ((props: never) => React.ReactNode)

/** Drop-in for `MenuOptionItem` (uniswap/src/components/menus/ContextMenu.tsx). */
export interface MenuOptionItemCompat {
  label: string
  onPress: () => void
  actionType?: 'default' | 'external-link'
  Icon?: MenuCompatIconComponent
  trailingIcon?: React.ReactNode
  showDivider?: boolean
  disabled?: boolean
  destructive?: boolean
  iconColor?: MenuCompatColorValue
  textColor?: MenuCompatColorValue
  closeDelay?: number
  subheader?: string
  height?: number
}

export type MenuOptionItemWithIdCompat = MenuOptionItemCompat & { id: string }

/** Drop-in for `DropdownMenuSheetItemProps` (ui/src/components/dropdownMenuSheet). */
export interface DropdownMenuSheetItemCompatProps {
  label: string
  icon?: React.ReactNode
  actionType?: 'default' | 'external-link'
  isSelected?: boolean
  disabled?: boolean
  destructive?: boolean
  closeDelay?: number
  textColor?: MenuCompatColorValue
  variant: 'small' | 'medium'
  height?: number
  /** react-native `Role` is a string union; the compat forwards it as the ARIA role. */
  role?: string
  subheader?: string
  rightElement?: React.ReactNode
  allowMultiline?: boolean
  onPress: () => void
  handleCloseMenu?: () => void
}

/**
 * The telemetry seam: analytics live in packages/uniswap and cannot be
 * imported here, so emission is host-injected. The conversion facade builds
 * an adapter from `useContextMenuTracking` + `sendAnalyticsEvent` and the
 * compat reports the same transitions/payloads the legacy hook derives.
 * See the menu parity exclusions ledger.
 */
export interface MenuTelemetryAdapter {
  onMenuOpened?: (info: { elementName?: string; sectionName?: string }) => void
  onMenuClosed?: (info: { elementName?: string; sectionName?: string }) => void
  /**
   * Called whenever `trackItemClicks` is set — WIDER than the legacy emission
   * condition (`trackItemClicks && elementName && sectionName`). For
   * emitted-event parity the conversion facade MUST reapply the
   * `elementName && sectionName` gate inside its adapter before forwarding to
   * `sendAnalyticsEvent`; the compat deliberately reports every transition
   * and leaves filtering to the host.
   */
  onMenuItemClicked?: (info: { elementName?: string; sectionName?: string; label: string; index: number }) => void
}

/** Drop-in for the `MenuContent` props (uniswap/src/components/menus/ContextMenuContent.tsx). */
export interface MenuContentCompatProps {
  items: MenuOptionItemCompat[]
  handleCloseMenu?: () => void
  /** Legacy `ElementName` — a string enum; typed as string here (telemetry stays host-side). */
  elementName?: string
  /** Legacy `SectionName` — a string enum; typed as string here (telemetry stays host-side). */
  sectionName?: string
  trackItemClicks?: boolean
  containerStyles?: MenuContentContainerStyles
  telemetryAdapter?: MenuTelemetryAdapter
}

/** Imperative handle for opening the menu at explicit screen coordinates, independent of `triggerMode`. */
export interface ContextMenuCompatHandle {
  openAt: (x: number, y: number) => void
}

/** Drop-in for `ContextMenuProps` (uniswap/src/components/menus/ContextMenu.tsx). */
export interface ContextMenuCompatProps {
  menuItems: MenuOptionItemCompat[]
  /** When provided, renders this content instead of the default MenuContent built from menuItems. */
  contentOverride?: React.ReactNode
  isPlacementAbove?: boolean
  isPlacementRight?: boolean
  offsetX?: number
  offsetY?: number
  /** Accepted-inert on web, exactly like the legacy web implementation (native-only today). */
  onPressAny?: (e: { name: string; index: number; indexPath: number[] }) => void
  /** `ContextMenuTriggerMode` string-enum values: primary = left click, secondary = right click. */
  triggerMode: 'primary' | 'secondary'
  disabled?: boolean
  isOpen: boolean
  closeMenu: () => void
  openMenu?: () => void
  elementName?: string
  sectionName?: string
  trackItemClicks?: boolean
  /**
   * Accepted with the exact legacy type, but the sheet leg is GATED on the
   * Sheet/Dialog migration track — the menu renders as a popover at every
   * viewport for now. See the menu parity exclusions ledger.
   */
  adaptToSheet?: boolean
  /** Native-only scrim; inert on web exactly like the legacy web implementation. */
  dimBackground?: boolean
  /**
   * Compat-only facade seam for the legacy scroll-lock gate: the legacy menu
   * wraps RemoveScroll in `isOpen && !isSheet && isWebApp`, so the extension
   * never blocks page scroll (mycelium must not depend on
   * `@universe/environment`, so the gate cannot live here). Conversion
   * facades pass `false` wherever the legacy gate evaluates false (extension,
   * and the sheet leg once it lands). Default true = web-app behavior.
   */
  blockOutsideScroll?: boolean
  children?: React.ReactNode
  /** Compat-only superset: the host-injected analytics seam (see MenuTelemetryAdapter). */
  telemetryAdapter?: MenuTelemetryAdapter
}

/**
 * Mirror of `getMenuItemColor` (ui/src/components/dropdownMenuSheet/utils.ts):
 * override > destructive ($statusCritical) > disabled ($neutral2) > $neutral1.
 */
export function getMenuItemColorCompat({
  overrideColor,
  destructive,
  disabled,
}: {
  overrideColor?: MenuCompatColorValue
  destructive?: boolean
  disabled?: boolean
}): MenuCompatColorValue {
  if (overrideColor) {
    return overrideColor
  }
  if (destructive) {
    return '$statusCritical'
  }
  if (disabled) {
    return '$neutral2'
  }
  return '$neutral1'
}
