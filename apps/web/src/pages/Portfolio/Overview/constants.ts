import { iconSizes, spacing } from '@universe/mycelium'
import { STICKY_TABLE_HEAD_SPACER_PX } from '~/components/Table/constants'

export const OVERVIEW_RIGHT_COLUMN_WIDTH = 360
export const MAX_TOKENS_ROWS = 8
export const MAX_ACTIVITY_ROWS = 5
export const MAX_LIMITS_LOADING_ROWS = 2
export const MAX_POOLS_ROWS = 5
export const MAX_MARGIN_ROWS = 5

/** Section heading → first row, for Earn and (via `MINI_TABLE_HEADER_GAP`) the mini tables. */
export const OVERVIEW_SECTION_CONTENT_GAP = spacing.spacing16
export const EARN_ROW_MIN_HEIGHT = spacing.spacing48
export const EARN_ROW_GAP = spacing.spacing4
export const EARN_ROW_LOGO_SIZE = iconSizes.icon32

/** Every Overview mini table spaces its rows like Earn's. */
export const MINI_TABLE_ROW_GAP = EARN_ROW_GAP

/** Activity, open limits and margin rows take Earn's row height, so the right column keeps one row pitch. */
export const HEADERLESS_MINI_TABLE_ROW_HEIGHT = EARN_ROW_MIN_HEIGHT

/**
 * Section heading → headerless mini table (activity, open limits, margin). Their hidden sticky header still
 * opens with the head's spacer and the row gap under it, so only the rest of Earn's content gap is added
 * here, which puts the first row level with Earn's.
 */
export const HEADERLESS_MINI_TABLE_CONTENT_GAP =
  OVERVIEW_SECTION_CONTENT_GAP - STICKY_TABLE_HEAD_SPACER_PX - MINI_TABLE_ROW_GAP

/**
 * Section heading → mini table header row (Tokens, Pools): Earn's content gap plus the inset of the logo
 * centered in an Earn row, so the left column's header pills line up with Earn's first logo.
 */
export const MINI_TABLE_HEADER_GAP = OVERVIEW_SECTION_CONTENT_GAP + (EARN_ROW_MIN_HEIGHT - EARN_ROW_LOGO_SIZE) / 2

/**
 * The headerless mini tables (activity, margin, open limits) drop the outer cells' side padding, so row
 * content sits on the inset `Table` gives its outer columns (see `getCommonPinningStyles`) — the same
 * `$spacing8` as the section heading and the Earn rows, with the row hover pill bleeding past it. Below md
 * the heading runs flush to the page gutter, and a wrapper cancels that inset by this amount.
 */
export const MINI_TABLE_MOBILE_BLEED_PX = spacing.spacing8
