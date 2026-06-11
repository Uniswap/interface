import { getTokenDescriptionColumnSize } from '~/pages/Explore/tables/Tokens/TokenDescription'

export const EXPANDABLE_ASSET_TABLE_ROW_HEIGHT = 64

/** Hard cap on how many RWA rows infinite scroll will reveal. */
export const RWA_TABLE_MAX_ROWS = 100

/** Extra rows rendered beyond what fills the viewport on initial load. */
export const RWA_TABLE_INITIAL_OVERSCAN_ROWS = 5

/** mWeb token column — narrower than Popular table (no `#` rank column). */
export const EXPANDABLE_ASSET_TABLE_TOKEN_COLUMN_SIZE_MOBILE = 220

export function getExpandableAssetTokenColumnSize(isLgBreakpoint: boolean, multichainTokenUxEnabled: boolean): number {
  if (!isLgBreakpoint) {
    return EXPANDABLE_ASSET_TABLE_TOKEN_COLUMN_SIZE_MOBILE
  }
  return getTokenDescriptionColumnSize(isLgBreakpoint, multichainTokenUxEnabled)
}
