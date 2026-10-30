/**
 * The menu-family compat prop contracts (INFRA-3021): drop-in types for the
 * `ContextMenu` / `MenuOptionItem` / `MenuContent` surfaces in packages/uniswap,
 * plus the menu item itself, without the Tamagui runtime.
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
  /**
   * Web only: extra styles for the default MenuContent frame, e.g. a maxHeight + scroll on a long
   * list. The legacy prop is Tamagui `FlexProps`, whose branded members cannot be named without the
   * Tamagui runtime — so, exactly like `MenuCompatColorValue` above, the type accepts the wider shape
   * and only the container keys the compat understands are applied.
   */
  menuContentStyles?: MenuContentContainerStyles | object
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
 * Menu item text/icon color: override > destructive ($statusCritical) > disabled ($neutral2) > $neutral1.
 * Generic so callers get their own override color type back.
 */
export function getMenuItemColorCompat<T extends MenuCompatColorValue = MenuCompatColorValue>({
  overrideColor,
  destructive,
  disabled,
}: {
  overrideColor?: T
  destructive?: boolean
  disabled?: boolean
}): T | '$statusCritical' | '$neutral2' | '$neutral1' {
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
