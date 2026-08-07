/**
 * Web entry for the filter-select compat — mirrors the base index.ts (web is
 * the real platform for mycelium; the native leg throws for components and
 * className compilers, see index.native.ts). Keep the export list in sync
 * with index.ts.
 */
export {
  FILTER_SELECT_CARD_DEFAULTS_COMPAT,
  FILTER_SELECT_CHECK_CLASS_NAME,
  FILTER_SELECT_ITEM_FRAME_CLASS_NAME,
  FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME,
  filterSelectButtonStyleClassName,
  filterSelectCardClassName,
  type FilterSelectDropdownStyles,
  filterSelectItemLabelClassName,
} from './compile'
export { FilterSelectCompat } from './FilterSelectCompat'
export { FilterSelectMultiCompat } from './FilterSelectMultiCompat'
export type {
  FilterSelectCompatProps,
  FilterSelectMultiCompatProps,
  FilterSelectMultiItemCompat,
  FilterSelectOptionCompat,
} from './types'
