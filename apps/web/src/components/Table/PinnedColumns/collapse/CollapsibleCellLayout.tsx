import { Flex } from '@universe/mycelium'
import type { CSSProperties, ReactNode } from 'react'
import {
  COLLAPSE_PROGRESS,
  COLLAPSE_TEXT_VISIBILITY_VAR,
  COLLAPSED_LOGO_SIZE,
  EXPANDED_LOGO_GAP_PX,
  EXPANDED_LOGO_SIZE,
  TEXT_FADE_END_PROGRESS,
} from '~/components/Table/PinnedColumns/collapse/utils'

const getCollapsingGapCss = (gapPx: number): string => `calc((1 - ${COLLAPSE_PROGRESS}) * ${gapPx}px)`

/**
 * Inline styles that interpolate a logo + text cell against the collapse progress (see
 * `useCollapsiblePinnedColumn`): the gap closes, the logo scales up, the text fades out. Exported
 * for cells whose markup lives in a shared component and can't be wrapped by `CollapsibleCellLayout`.
 *
 * Collapsed geometry: the collapsed column less its cell padding leaves a 32px content box — the
 * logo's layout box once the gap has closed and the text block has been squeezed to zero, so the
 * logo lands centered. A 32px split pair logo (one circle) fits the same box unchanged. The scale-up is a transform, so it costs no layout width, and a padded
 * cell's padding keeps it clear of `Cell`'s `overflow: hidden` (a flush cell scales from the left edge instead).
 */
export const COLLAPSIBLE_CELL_STYLES = {
  row: {
    columnGap: getCollapsingGapCss(EXPANDED_LOGO_GAP_PX),
  },
  logo: {
    flexShrink: 0,
    transform: `scale(calc(1 + ${COLLAPSE_PROGRESS} * ${COLLAPSED_LOGO_SIZE / EXPANDED_LOGO_SIZE - 1}))`,
  },
  // calc() clamps opacity into [0, 1] on its own. The visibility custom property (set by the hook at
  // the same threshold) takes the faded text out of the accessibility tree as well.
  text: {
    opacity: `calc((${TEXT_FADE_END_PROGRESS} - ${COLLAPSE_PROGRESS}) / ${TEXT_FADE_END_PROGRESS})`,
    // A custom property is a valid `visibility` value at runtime, but not in React's keyword union.
    visibility: `var(${COLLAPSE_TEXT_VISIBILITY_VAR}, visible)` as CSSProperties['visibility'],
  },
} satisfies Record<'row' | 'logo' | 'text', CSSProperties>

/** `COLLAPSIBLE_CELL_STYLES` for a flush cell (see `CollapsibleCellLayout`'s `flush`). */
export const FLUSH_COLLAPSIBLE_CELL_STYLES = {
  ...COLLAPSIBLE_CELL_STYLES,
  logo: { ...COLLAPSIBLE_CELL_STYLES.logo, transformOrigin: 'left center' },
} satisfies Record<'row' | 'logo' | 'text', CSSProperties>

/**
 * Cell body for a collapsible pinned column: `logo` stays and scales up, `children` (the text block)
 * fades out. Without an active collapse it renders the expanded layout, so a cell can render it
 * unconditionally. `gapPx` is the expanded logo-to-text gap; it closes to 0 either way. `flush` is for
 * a cell with no left padding (`FLUSH_CELL_PADDING`): `Cell`'s `overflow: hidden` then sits at the
 * logo's left edge, so the logo scales up from that edge, since growing from its center would clip it.
 */
export function CollapsibleCellLayout({
  logo,
  children,
  gapPx = EXPANDED_LOGO_GAP_PX,
  flush = false,
}: {
  logo: ReactNode
  children: ReactNode
  gapPx?: number
  flush?: boolean
}): JSX.Element {
  const styles = flush ? FLUSH_COLLAPSIBLE_CELL_STYLES : COLLAPSIBLE_CELL_STYLES
  const rowStyle = gapPx === EXPANDED_LOGO_GAP_PX ? styles.row : { columnGap: getCollapsingGapCss(gapPx) }
  return (
    <Flex row alignItems="center" width="100%" style={rowStyle}>
      <Flex style={styles.logo}>{logo}</Flex>
      <Flex flex={1} minWidth={0} style={COLLAPSIBLE_CELL_STYLES.text}>
        {children}
      </Flex>
    </Flex>
  )
}
