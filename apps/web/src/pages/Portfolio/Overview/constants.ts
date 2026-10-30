import { spacing } from '@universe/mycelium'

export const OVERVIEW_RIGHT_COLUMN_WIDTH = 360
export const MAX_TOKENS_ROWS = 8
export const MAX_ACTIVITY_ROWS = 5
export const MAX_LIMITS_LOADING_ROWS = 2
export const MAX_POOLS_ROWS = 5

/**
 * Below md the headerless mini tables (activity, open limits) run flush to the page gutter like their
 * section heading: a wrapper cancels the padding `Table` gives its outer columns (see
 * `getCommonPinningStyles`), and the outer cells drop their side padding.
 */
export const MINI_TABLE_MOBILE_BLEED_PX = spacing.spacing8
