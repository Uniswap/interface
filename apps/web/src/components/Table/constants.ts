import { spacing } from '@universe/mycelium'

export const ROW_HEIGHT_DESKTOP = 56
export const ROW_HEIGHT_MOBILE_WEB = 48

/**
 * Default `rowGap`: px between unpinned body rows and under the header row. Styles use the token, not the px
 * value, so tables that don't set `rowGap` keep their exact output; layout math uses the px value.
 */
export const TABLE_ROW_GAP_PX = spacing.spacing2
export const TABLE_ROW_GAP_TOKEN = '$spacing2'

/** Spacer a sticky `TableHead` opens with, above the header row; it is also the stuck row's clearance. */
export const STICKY_TABLE_HEAD_SPACER_PX = 12

/**
 * Clearance between the app header and a sticky element below it, on the add-liquidity pool browser.
 * Shared by the pools table's `stickyTopOffset` and the step sidebar's offset so the two stay on the
 * same line.
 *
 * Not derivable from `TableHead`'s 12px opening child: that child only reads as clearance where the
 * head's box has room for it (Explore's shorter header row), and the pool browser's taller row pushes
 * it out of the box entirely, leaving the row flush against the app header.
 */
export const STICKY_HEADER_TOP_GAP = 12
