import type { FlexProps } from 'ui/src'
import { spacing } from 'ui/src/theme'

/** Default shelf card width at large breakpoints (>1024px, 4 cards visible). */
export const ASSET_CARD_WIDTH = 278

/** Figma shelf card width (narrow variant, e.g. the TDP "Related tokens" shelf). */
export const ASSET_CARD_WIDTH_NARROW = 176

/** Max card width on small viewports (<=450px). */
export const ASSET_SHELF_SMALL_CARD_MAX_WIDTH = 280

/** Horizontal gap between shelf carousel cards. */
export const ASSET_SHELF_CARD_GAP = spacing.spacing12

/** Width of left/right edge fade overlays on the shelf carousel. */
export const ASSET_SHELF_CAROUSEL_FADE_WIDTH = 96

/** Narrow fade overlay width on small viewports (<=450px). */
export const ASSET_SHELF_CAROUSEL_FADE_WIDTH_SMALL = 24

export const assetCardShellProps = {
  flexDirection: 'column',
  gap: '$spacing12',
  flexShrink: 0,
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  borderRadius: '$rounded16',
  backgroundColor: '$surface1',
  p: '$spacing12',
} as const satisfies FlexProps

export const ASSET_CARD_SPARKLINE_WIDTH = 64
export const ASSET_CARD_SPARKLINE_HEIGHT = 36
