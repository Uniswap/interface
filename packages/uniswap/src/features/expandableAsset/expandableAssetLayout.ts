import { spacing } from 'ui/src/theme/spacing'
import type { ExpandableAssetGroupVariant } from 'uniswap/src/features/expandableAsset/types'

/** Expand/collapse height transition for grouped table rows. */
export const EXPANDABLE_ASSET_ROW_HEIGHT_TRANSITION_MS = 200

/** Min height for one issuer row inside an expanded group (table variant). */
export const EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX = 64

/** Height for one issuer row inside an expanded search group (Figma `Name` row = 56px). */
export const EXPANDABLE_ASSET_ISSUER_ROW_SEARCH_HEIGHT_PX = 56

/** Gap between issuer divs inside the inner `$surface1` container (table variant). */
export const EXPANDABLE_ASSET_ISSUER_GAP_PX = spacing.spacing4

/** Gap between issuer rows in the search panel; the panel is transparent with a `$surface5` border and each row
 *  paints its own `$surface1`, so the 2px gaps reveal the `$surface2` shell behind (per Figma). */
export const EXPANDABLE_ASSET_ISSUER_GAP_SEARCH_PX = spacing.spacing2

/** Horizontal padding inside the inner `$surface1` container (table hover inset). */
export const EXPANDABLE_ASSET_INNER_PADDING_X_PX = spacing.spacing4

/** Vertical padding on the inner issuer container (`$surface1`) — table variant only. */
export const EXPANDABLE_ASSET_INNER_PADDING_Y_PX = spacing.spacing4

/** Padding on the outer `$surface2` expandable row container (table). */
export const EXPANDABLE_ASSET_TABLE_SHELL_PADDING_PX = spacing.spacing4

/** Gap between the parent metrics row and the inner issuer block inside the same container. */
export const EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX = spacing.spacing8

/** Horizontal inset (each side) from the search-variant expanded row's outer edge to the shell's border box — keep in sync with `ExpandableSearchRow.tsx`'s expanded-shell `px={7}` + `borderWidth="$spacing1"`. */
export const EXPANDABLE_ASSET_SEARCH_SHELL_INSET_X_PX = spacing.spacing8

/** Total horizontal inset (each side) from the search modal's row slot to an expanded issuer sub-row's content edge — keep in sync with `ExpandableSearchRow`/`ExpandableIssuerPanelContainer`/`ExpandableIssuerRows`. */
export const EXPANDABLE_ASSET_SEARCH_ISSUER_ROW_RIGHT_INSET_PX =
  spacing.spacing12 + EXPANDABLE_ASSET_SEARCH_SHELL_INSET_X_PX + spacing.spacing1 + spacing.spacing8

/**
 * Height of the inner issuer list (surface1 block only).
 * Keep in sync with `ExpandableIssuerPanelContainer` / `ExpandableIssuerRows` in `ExpandableIssuerPanel.tsx`.
 *
 * - `table` (default): includes `py="$spacing4"` (top + bottom) and `gap="$spacing4"` between rows;
 *   rows are `EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX` tall.
 * - `search`: no inner padding, a `$surface5` border (top + bottom), `gap="$spacing2"` between rows
 *   (each gap shows the `$surface2` shell behind it), and `EXPANDABLE_ASSET_ISSUER_ROW_SEARCH_HEIGHT_PX` rows.
 */
export function getExpandableIssuerPanelHeightPx({
  issuerCount,
  variant = 'table',
}: {
  issuerCount: number
  variant?: ExpandableAssetGroupVariant
}): number {
  if (issuerCount <= 0) {
    return 0
  }

  const isSearch = variant === 'search'
  // search: surface5 border top + bottom; table: inner py top + bottom.
  const chromeY = isSearch ? 2 * spacing.spacing1 : EXPANDABLE_ASSET_INNER_PADDING_Y_PX * 2
  const rowHeight = isSearch ? EXPANDABLE_ASSET_ISSUER_ROW_SEARCH_HEIGHT_PX : EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX
  const gap = isSearch ? EXPANDABLE_ASSET_ISSUER_GAP_SEARCH_PX : EXPANDABLE_ASSET_ISSUER_GAP_PX

  return chromeY + issuerCount * rowHeight + (issuerCount - 1) * gap
}

/**
 * Cell-height estimate for a search-variant collection row: the native `overrideItemLayout` size + web's
 * pre-measurement fallback (both re-measure/correct on-screen, so a slight over-estimate is harmless).
 *
 * A COLLAPSED row (incl. single-issuer) renders flat — bare parent, no shell. The shell padding/border, the
 * parent↔panel gap, and the issuer panel exist only when EXPANDED.
 *
 * The expanded branch budgets the parent at the full 64px collapsed height, not the header's true ~44px (it's
 * deliberately not pinned). This ~20px OVER-estimate is intentional — don't "tighten" it: that height is
 * locale/font-fragile and an under-estimate would clip on native.
 *
 * Keep in sync with `ExpandableSearchRow.tsx` (`p="$spacing8"`, `borderWidth="$spacing1"`) and the
 * `EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX` parent↔panel gap in the platform `ExpandableSearchRowContainer`s.
 */
export function getExpandableSearchRowHeightPx({
  issuerCount,
  expanded,
}: {
  issuerCount: number
  expanded: boolean
}): number {
  const parent = EXPANDABLE_ASSET_ISSUER_ROW_MIN_HEIGHT_PX

  // Collapsed rows (incl. single-issuer) render the bare parent content directly (no shell).
  if (!expanded) {
    return parent
  }

  // Search-shell vertical padding (`p="$spacing8"`) + border (`borderWidth="$spacing1"`), top + bottom.
  const shell = 2 * spacing.spacing8 + 2 * spacing.spacing1
  // Parent row ↔ issuer-panel gap, present only when the issuer panel renders.
  const gap = EXPANDABLE_ASSET_SHELL_HEADER_GAP_PX

  return parent + shell + gap + getExpandableIssuerPanelHeightPx({ issuerCount, variant: 'search' })
}
