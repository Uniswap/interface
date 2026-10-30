import { iconSizes } from '@universe/mycelium'
import type { TableColumnMeta } from '~/components/Table/types'

/**
 * Single source of geometry for the mobile pinned-column collapse, shared by
 * `useCollapsiblePinnedColumn` (which drives the progress), the column meta `Table` merges onto the
 * collapsible column, and the cells (`CollapsibleCellLayout` and friends, which interpolate against
 * it) so they can't drift apart.
 */

/** 0 → expanded, 1 → fully collapsed. Written to the collapse root by `useCollapsiblePinnedColumn`; every visual reads it through `calc()`, so a collapse never re-renders React. */
export const COLLAPSE_PROGRESS_VAR = '--pinned-column-collapse'

/**
 * `visible` | `hidden` for the fading text block. Opacity alone leaves text in the accessibility
 * tree (screen readers still announce it), so the hook flips this to `hidden` once the text has
 * fully faded — as a custom property, not React state, so it stays render-free.
 */
export const COLLAPSE_TEXT_VISIBILITY_VAR = '--pinned-column-collapse-text'

/**
 * Fully collapsed pinned column: a 32px logo, centered, and nothing else. The column's cell padding
 * (8px pinned + 12px `Cell`, both sides) leaves exactly the logo's 32px layout box.
 */
export const DEFAULT_COLLAPSED_COLUMN_WIDTH = 72

/**
 * Flush pinned column, Figma's mobile Explore inset: the cell drops its left padding so the logo sits on
 * the pinned 8px alone, and the header label lands 12px in. Collapsed, the cell keeps its 12px right
 * padding, which leaves the logo's 32px content box and room for what overhangs it: the 36px thumbnail
 * (scaled from its left edge, see `CollapsibleCellLayout`'s `flush`), its network badge, and the header
 * label, which stays put (no right padding, so it can use that room).
 */
export const FLUSH_COLLAPSED_COLUMN_WIDTH = 60
export const FLUSH_CELL_PADDING = { pl: '$none' } as const
export const FLUSH_HEADER_CELL_PADDING = { pl: '$spacing4', pr: '$none' } as const

/** Gesture travel that fully collapses, or fully grows back, the column. */
export const COLLAPSE_SCROLL_RANGE_PX = 100

export const EXPANDED_LOGO_SIZE = iconSizes.icon32
/** Collapsed thumbnail size (design ask: scale the sticky logo up a little). Applied as a transform, so the cell's layout box stays `EXPANDED_LOGO_SIZE`. */
export const COLLAPSED_LOGO_SIZE = 36

/** Gap between logo and text when expanded (matches TokenDescription's `$gap8` + `$spacing4`); interpolates to 0 so the collapsed logo lands centered. */
export const EXPANDED_LOGO_GAP_PX = 12

/** Progress at which the text block has fully faded — also where it leaves the accessibility tree. */
export const TEXT_FADE_END_PROGRESS = 0.55

/** `var()` reference to the collapse progress, for composing `calc()` expressions. */
export const COLLAPSE_PROGRESS = `var(${COLLAPSE_PROGRESS_VAR}, 0)`

export interface PinnedColumnWidths {
  expandedWidth: number
  collapsedWidth: number
}

/**
 * Rendered width of the pinned column. Tanstack's column size stays at the expanded width; only
 * the painted width follows the collapse (see `TableColumnMeta.widthOverride`).
 */
export function getPinnedColumnWidthCss({ expandedWidth, collapsedWidth }: PinnedColumnWidths): string {
  return `calc(${expandedWidth}px - ${COLLAPSE_PROGRESS} * ${expandedWidth - collapsedWidth}px)`
}

/**
 * Column meta that paints the collapse: pure CSS against the progress custom property, so it is
 * valid on a column whether or not a collapse is currently driving it (unset progress reads as 0,
 * i.e. the expanded width).
 */
export function getCollapsiblePinnedColumnMeta(widths: PinnedColumnWidths): TableColumnMeta {
  return {
    widthOverride: getPinnedColumnWidthCss(widths),
    // The scroll travel the collapse has consumed, as margin after the column. It grows by exactly
    // what `scrollLeft` advanced, so the data columns hold still against the column's right edge
    // until it is fully collapsed; the margin itself always sits hidden beneath the sticky column.
    trailingMarginCss: `calc(${COLLAPSE_PROGRESS} * ${COLLAPSE_SCROLL_RANGE_PX}px)`,
  }
}
