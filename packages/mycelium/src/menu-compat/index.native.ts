/**
 * Native entry for the menu compat. `DropdownMenuSheetItemCompat` and `getMenuItemColorCompat` are
 * real; the rest of the menu family stays web-only (native menus render through
 * `uniswap/src/components/menus/ContextMenu.native`), so those components and className compilers
 * throw at render/call time instead of silently rendering nothing. Platform-neutral values are
 * exported for real so cross-platform importers resolve every symbol the web leg exports.
 */
import * as React from 'react'

// Pure data — safe (and meaningful) off-web; re-exported so values never drift.
export {
  MENU_CONTENT_CONTAINER_DEFAULTS_COMPAT,
  MENU_CONTENT_SHEET_CONTAINER_STYLES_COMPAT,
  MENU_MAX_WIDTH,
  MENU_MIN_WIDTH,
} from './compile'
export type {
  DropdownMenuSheetItemFrameStyleInputs,
  DropdownMenuSheetItemLabelStyleInputs,
  MenuContentContainerStyles,
} from './compile'
export { DropdownMenuSheetItemCompat } from './DropdownMenuSheetItemCompat'
export { getMenuItemColorCompat } from './types'
export type {
  ContextMenuCompatHandle,
  ContextMenuCompatProps,
  DropdownMenuSheetItemCompatProps,
  MenuCompatColorValue,
  MenuCompatIconComponent,
  MenuContentCompatProps,
  MenuOptionItemCompat,
  MenuOptionItemWithIdCompat,
  MenuTelemetryAdapter,
} from './types'

/**
 * Inert stand-in for the web host context (the real one lives next to the
 * Base-UI-backed content, which cannot load on native).
 */
export const MenuCompatHostContext = React.createContext<{ insideMenu: boolean }>({ insideMenu: false })

function throwNativeStub(name: string): never {
  throw new Error(`${name} is web-only; see menu-compat/index.native.ts.`)
}

export function ContextMenuCompat(): never {
  return throwNativeStub('ContextMenuCompat')
}

export function MenuContentCompat(): never {
  return throwNativeStub('MenuContentCompat')
}

export function CheckCircleFilledGlyph(): never {
  return throwNativeStub('CheckCircleFilledGlyph')
}

export function ExternalLinkGlyph(): never {
  return throwNativeStub('ExternalLinkGlyph')
}

export function menuContentContainerClassName(): never {
  return throwNativeStub('menuContentContainerClassName')
}

export function menuSeparatorClassName(): never {
  return throwNativeStub('menuSeparatorClassName')
}

export function dropdownMenuSheetItemFrameClassName(): never {
  return throwNativeStub('dropdownMenuSheetItemFrameClassName')
}

export function dropdownMenuSheetItemLabelClassName(): never {
  return throwNativeStub('dropdownMenuSheetItemLabelClassName')
}

export function dropdownMenuSheetItemSubheaderClassName(): never {
  return throwNativeStub('dropdownMenuSheetItemSubheaderClassName')
}

export function resolveMenuColor(): never {
  return throwNativeStub('resolveMenuColor')
}
