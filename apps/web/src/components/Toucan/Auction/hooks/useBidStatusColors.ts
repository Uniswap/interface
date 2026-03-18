import { useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'

// Gradient colors for in-range bids (from Figma)
export const GRADIENT_START_COLOR = '#21c95e'
export const GRADIENT_END_COLOR = '#b1f13c'
export const GRADIENT_BORDER_COLOR = '#cfffaf'
export const GRADIENT_BADGE_BORDER_COLOR = opacify(12, GRADIENT_START_COLOR)

export function useBidStatusColors() {
  const colors = useSporeColors()

  return {
    inRangeColor: colors.statusSuccess.val,
    warningColor: '#FFBE18',
    inRangeColorLessOpacity: opacify(70, colors.statusSuccess.val),
    outOfRangeColor: colors.statusCritical.val,
    isClaimedColor: colors.surface3.val,
  }
}
