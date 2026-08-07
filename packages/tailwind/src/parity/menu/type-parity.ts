/**
 * Type-level drop-in contract for the Base-UI-backed menu-family compat
 * (INFRA-3021): every prop accepted by the legacy `ContextMenu`
 * (`packages/uniswap`), `MenuOptionItem`, `MenuContent`, and
 * `DropdownMenuSheetItem` (`packages/ui`) is either covered by the compat
 * contracts or listed in the explicit exclusion unions below. Value-level
 * fragments pin the token-typed leaks (iconColor/textColor,
 * containerStyles) to stay assignable.
 *
 * Compiled by `tsconfig.type-parity.json` (driven from
 * `type-parity.test.ts`). A newly uncovered key fails the build with the key
 * names in the error message.
 */
import type { ComponentProps } from 'react'
import type { DropdownMenuSheetItemProps } from 'ui/src'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type {
  ContextMenuCompatProps,
  DropdownMenuSheetItemCompatProps,
  MenuContentCompatProps,
  MenuOptionItemCompat,
} from '../../../../mycelium/src/menu-compat/types'
// Relative cross-package imports on purpose: these are type-only legacy
// references compiled by the dedicated tsconfig.type-parity.json program
// (driven from type-parity.test.ts). The alias form would make the nx
// tsconfig-sync generator add a tailwind -> uniswap project reference,
// pulling the whole uniswap graph (and its generated-code requirements)
// into tailwind's own typecheck — the package-boundary inversion the menu
// exclusions ledger rules out.
// nx-ignore-next-line
import type { ContextMenuProps, MenuOptionItem } from '../../../../uniswap/src/components/menus/ContextMenu'
// nx-ignore-next-line
import type { MenuContent } from '../../../../uniswap/src/components/menus/ContextMenuContent'
// nx-ignore-next-line
import { ContextMenuTriggerMode } from '../../../../uniswap/src/components/menus/types'

type LegacyMenuContentProps = ComponentProps<typeof MenuContent>

// ── ContextMenu ─────────────────────────────────────────────────────────

type UncoveredContextMenuKeys = Exclude<keyof ContextMenuProps, keyof ContextMenuCompatProps>
declare const uncoveredContextMenuKeys: { [K in UncoveredContextMenuKeys]: K }
export const contextMenuPropsFullyCovered: Record<never, never> = uncoveredContextMenuKeys

// The full legacy props object must be assignable — the compat accepts every
// value the legacy component accepts (including the string-enum triggerMode
// and the analytics names typed as strings).
declare const legacyContextMenuProps: ContextMenuProps
export const contextMenuPropsAssignable: ContextMenuCompatProps = legacyContextMenuProps

// ── MenuOptionItem ──────────────────────────────────────────────────────

type UncoveredMenuOptionItemKeys = Exclude<keyof MenuOptionItem, keyof MenuOptionItemCompat>
declare const uncoveredMenuOptionItemKeys: { [K in UncoveredMenuOptionItemKeys]: K }
export const menuOptionItemFullyCovered: Record<never, never> = uncoveredMenuOptionItemKeys

// Whole-type assignability: the item vocabulary (incl. token-typed
// iconColor/textColor and the GeneratedIcon component union) must fit.
declare const legacyMenuOptionItem: MenuOptionItem
export const menuOptionItemAssignable: MenuOptionItemCompat = legacyMenuOptionItem

// ── MenuContent ─────────────────────────────────────────────────────────

type UncoveredMenuContentKeys = Exclude<keyof LegacyMenuContentProps, keyof MenuContentCompatProps>
declare const uncoveredMenuContentKeys: { [K in UncoveredMenuContentKeys]: K }
export const menuContentPropsFullyCovered: Record<never, never> = uncoveredMenuContentKeys

// containerStyles is a full Tamagui FlexProps leak; whole-union assignability
// is covered by the Flex compat key contract (flex/type-parity.ts). Here the
// real call-site payloads are pinned: the sheet container styles constant and
// representative fragments.
type AcceptsMenuContentFragment<T extends Partial<MenuContentCompatProps>> = T
export type MenuContentValueLevelChecks = [
  AcceptsMenuContentFragment<Pick<LegacyMenuContentProps, 'items' | 'handleCloseMenu' | 'trackItemClicks'>>,
  AcceptsMenuContentFragment<Pick<LegacyMenuContentProps, 'elementName' | 'sectionName'>>,
  AcceptsMenuContentFragment<{
    // MENU_CONTENT_SHEET_CONTAINER_STYLES, verbatim.
    containerStyles: {
      p: '$none'
      pb: '$spacing16'
      backgroundColor: 'transparent'
      borderWidth: '$none'
      gap: '$spacing8'
      display: 'flex'
      flexDirection: 'column'
      width: '100%'
      minWidth: undefined
      maxWidth: undefined
    }
  }>,
]

// ── DropdownMenuSheetItem ───────────────────────────────────────────────

type UncoveredSheetItemKeys = Exclude<keyof DropdownMenuSheetItemProps, keyof DropdownMenuSheetItemCompatProps>
declare const uncoveredSheetItemKeys: { [K in UncoveredSheetItemKeys]: K }
export const dropdownMenuSheetItemPropsFullyCovered: Record<never, never> = uncoveredSheetItemKeys

declare const legacySheetItemProps: DropdownMenuSheetItemProps
export const dropdownMenuSheetItemPropsAssignable: DropdownMenuSheetItemCompatProps = legacySheetItemProps

// ── Sanity tripwires ────────────────────────────────────────────────────

type RequiredContextMenuKey =
  | 'menuItems'
  | 'contentOverride'
  | 'triggerMode'
  | 'isOpen'
  | 'closeMenu'
  | 'openMenu'
  | 'adaptToSheet'
  | 'dimBackground'
  | 'onPressAny'
declare const requiredContextMenuKeysPresent: RequiredContextMenuKey extends keyof ContextMenuProps
  ? true
  : { missingFromContextMenuProps: Exclude<RequiredContextMenuKey, keyof ContextMenuProps> }
export const contextMenuLegacySanity: true = requiredContextMenuKeysPresent

// Both enum members stay assignable to the compat's literal union.
export const triggerModePrimaryAssignable: ContextMenuCompatProps['triggerMode'] = ContextMenuTriggerMode.Primary
export const triggerModeSecondaryAssignable: ContextMenuCompatProps['triggerMode'] = ContextMenuTriggerMode.Secondary
