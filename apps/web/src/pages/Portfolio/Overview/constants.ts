import { spacing } from '@universe/mycelium'

export const OVERVIEW_RIGHT_COLUMN_WIDTH = 360
export const MAX_TOKENS_ROWS = 8
export const MAX_ACTIVITY_ROWS = 5
export const MAX_LIMITS_LOADING_ROWS = 2
export const MAX_POOLS_ROWS = 5
export const MAX_MARGIN_ROWS = 5

/**
 * The headerless mini tables (activity, margin, open limits) drop the outer cells' side padding, so row
 * content sits on the inset `Table` gives its outer columns (see `getCommonPinningStyles`) — the same
 * `$spacing8` as the section heading and the Earn rows, with the row hover pill bleeding past it. Below md
 * the heading runs flush to the page gutter, and a wrapper cancels that inset by this amount.
 */
export const MINI_TABLE_MOBILE_BLEED_PX = spacing.spacing8
