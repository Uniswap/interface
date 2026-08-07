/**
 * Native stub for the web-only filter-select compat. The native leg is
 * deferred per INFRA-3021 (native keeps ActionSheetDropdown until the
 * uniwind track lands). Components and className compilers throw at
 * render/call time so an accidental native import fails loudly;
 * platform-neutral values (the verbatim card defaults, literal class
 * strings as data) are exported for real so cross-platform importers
 * resolve every symbol the web leg exports.
 */

// Pure data — safe off-web; re-exported so values never drift.
export {
  FILTER_SELECT_CARD_DEFAULTS_COMPAT,
  FILTER_SELECT_CHECK_CLASS_NAME,
  FILTER_SELECT_ITEM_FRAME_CLASS_NAME,
  FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME,
} from './compile'
export type { FilterSelectDropdownStyles } from './compile'
export type {
  FilterSelectCompatProps,
  FilterSelectMultiCompatProps,
  FilterSelectMultiItemCompat,
  FilterSelectOptionCompat,
} from './types'

function throwNativeStub(name: string): never {
  throw new Error(`${name} is web-only; the native leg is deferred (INFRA-3021).`)
}

export function FilterSelectCompat(): never {
  return throwNativeStub('FilterSelectCompat')
}

export function FilterSelectMultiCompat(): never {
  return throwNativeStub('FilterSelectMultiCompat')
}

export function filterSelectButtonStyleClassName(): never {
  return throwNativeStub('filterSelectButtonStyleClassName')
}

export function filterSelectCardClassName(): never {
  return throwNativeStub('filterSelectCardClassName')
}

export function filterSelectItemLabelClassName(): never {
  return throwNativeStub('filterSelectItemLabelClassName')
}
