/* eslint-disable import/no-unused-modules */
export const MAX_STACKED_BANNERS = 3
export const VERTICAL_OFFSET = 6 // pixels between each stacked banner
export const SCALE_DECREMENT = 0.05 // each banner is 5% smaller than the one above
export const BASE_Z_INDEX = 1030 // Base z-index for stacked banners (below modalBackdrop at 1040)

interface StackingProps {
  scale: number
  offsetY: number
  zIndex: number
}

/**
 * Pure calculation function for banner stacking properties.
 *
 * @param index - The index of the notification in the stack (0 = bottom, higher index = top)
 * @param total - Total number of notifications in the stack
 * @returns Stacking properties for the banner (scale, offsetY, zIndex)
 */
export function calculateStackingProps(index: number, total: number): StackingProps {
  const stackPosition = total - index - 1
  return {
    scale: 1 - stackPosition * SCALE_DECREMENT,
    offsetY: stackPosition * VERTICAL_OFFSET,
    zIndex: BASE_Z_INDEX + (MAX_STACKED_BANNERS - stackPosition),
  }
}
