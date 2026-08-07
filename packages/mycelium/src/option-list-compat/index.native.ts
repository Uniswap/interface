/**
 * Native stub for the web-only option-list compat. The native leg is
 * deferred per INFRA-3021 (native keeps the legacy NetworkFilter/ContextMenu
 * implementations until the uniwind track lands). Components and className
 * compilers throw at render/call time so an accidental native import fails
 * loudly instead of silently rendering nothing. Platform-neutral values (the
 * pure search filter, verbatim legacy prop payloads, literal class strings
 * as data) are exported for real so cross-platform importers resolve every
 * symbol the web leg exports.
 */

// Pure data / pure functions — safe (and meaningful) off-web; re-exported so values never drift.
export {
  OPTION_CHECKED_MARKER_CLASS_NAME,
  OPTION_LIST_BOTTOM_FADE_CLASS_NAME,
  OPTION_LIST_EMPTY_STATE_CLASS_NAME,
  OPTION_LIST_SCROLL_CLASS_NAME,
  OPTION_LIST_SCROLL_SHELL_CLASS_NAME,
  OPTION_LIST_SEARCH_INPUT_CLASS_NAME,
  OPTION_LIST_SEARCH_INPUT_FRAME_CLASS_NAME,
  OPTION_LIST_SECTION_HEADER_FRAME_PROPS_COMPAT,
  OPTION_LIST_SECTION_HEADER_STICKY_PROPS_COMPAT,
  OPTION_LIST_SECTION_HEADER_TITLE_PROPS_COMPAT,
  OPTION_ROW_ACTIVE_CLASS_NAME,
  OPTION_ROW_FRAME_PROPS_COMPAT,
  OPTION_ROW_LABEL_PROPS_COMPAT,
  OPTION_ROW_PILE_ITEM_CLASS_NAME,
  SELECT_ALL_CLEAR_HEADER_CLASS_NAMES,
} from './compile'
export type { OptionListSectionHeaderStyleInputs, OptionRowFrameStyleInputs } from './compile'
export { normalizeOptionSearchQuery, optionMatchesSearchQuery, type SearchableOptionFields } from './filter'
export type {
  CheckboxOptionItemCompatProps,
  OptionListItemCompat,
  OptionListSectionCompat,
  OptionRowCompatProps,
  SearchableOptionListCompatProps,
  SelectAllClearHeaderCompatProps,
} from './types'

function throwNativeStub(name: string): never {
  throw new Error(`${name} is web-only; the native leg is deferred (INFRA-3021).`)
}

export function CheckboxOptionItemCompat(): never {
  return throwNativeStub('CheckboxOptionItemCompat')
}

export function OptionRowCompat(): never {
  return throwNativeStub('OptionRowCompat')
}

export function SearchableOptionListCompat(): never {
  return throwNativeStub('SearchableOptionListCompat')
}

export function SelectAllClearHeaderCompat(): never {
  return throwNativeStub('SelectAllClearHeaderCompat')
}

export function CheckmarkCircleGlyph(): never {
  return throwNativeStub('CheckmarkCircleGlyph')
}

export function SearchGlyph(): never {
  return throwNativeStub('SearchGlyph')
}

export function optionListSectionHeaderClassName(): never {
  return throwNativeStub('optionListSectionHeaderClassName')
}

export function optionListSectionHeaderTitleClassName(): never {
  return throwNativeStub('optionListSectionHeaderTitleClassName')
}

export function optionRowFrameClassName(): never {
  return throwNativeStub('optionRowFrameClassName')
}

export function optionRowLabelClassName(): never {
  return throwNativeStub('optionRowLabelClassName')
}
