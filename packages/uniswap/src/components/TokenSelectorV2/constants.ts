import { TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'

// V2 web modal per Figma Input.Default (750:13014): 640×536 outer frame,
// 392px discovery pane + 224px My-tokens sidebar.
export const TOKEN_SELECTOR_V2_WEB_MAX_WIDTH = 640
export const TOKEN_SELECTOR_V2_WEB_MAX_HEIGHT = 536

export const TOKEN_SELECTOR_V2_SIDEBAR_WIDTH = 224
export const TOKEN_SELECTOR_V2_SIDEBAR_ROW_HEIGHT = 47
/** The sidebar bleeds through the modal's 8px surface2 frame so its scrollbar rides the modal edge. */
export const TOKEN_SELECTOR_V2_SIDEBAR_EDGE_BLEED = 8
export const TOKEN_SELECTOR_V2_SIDEBAR_TOTAL_WIDTH =
  TOKEN_SELECTOR_V2_SIDEBAR_WIDTH + TOKEN_SELECTOR_V2_SIDEBAR_EDGE_BLEED

// Input selector shows 4 suggested tiles, output shows 6 (Figma 750:13084).
export const SUGGESTED_TILES_INPUT_COUNT = 4
export const SUGGESTED_TILES_OUTPUT_COUNT = 6

export function getSuggestedTilesMaxCount(variation: TokenSelectorVariation): number {
  return variation === TokenSelectorVariation.SwapOutput ? SUGGESTED_TILES_OUTPUT_COUNT : SUGGESTED_TILES_INPUT_COUNT
}

// Compact (icon-only) chip row shows this many network chips before the +N overflow chip.
export const NETWORK_CHIP_COMPACT_VISIBLE_COUNT = 8

export const NETWORK_CHIP_BORDER_RADIUS = 10

export const RECENT_PILLS_MAX_COUNT = 8

// Height of the V2 search input; shared with the sidebar controls.
export const TOKEN_SELECTOR_V2_CONTROL_HEIGHT = 48
