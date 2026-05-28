import { useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { type BidDisplayState } from '~/features/Toucan/Auction/utils/bidDetails'

export function useBidStatusColors() {
  const colors = useSporeColors()

  return {
    inRangeColor: colors.statusSuccess.val,
    warningColor: '#FFBE18',
    inRangeColorLessOpacity: opacify(70, colors.statusSuccess.val),
    outOfRangeColor: colors.statusCritical.val,
    isClaimedColor: colors.surface3.val,
    neutralColor: colors.neutral2.val,
  }
}

/**
 * Maps a BidDisplayState to its resolved status color.
 * Single source of truth for status → color mapping across all bid UI.
 */
export function getDisplayStateColor(
  displayState: BidDisplayState,
  colors: { inRangeColor: string; outOfRangeColor: string; neutralColor: string },
): string {
  switch (displayState) {
    case 'inRange':
    case 'complete':
    case 'withdrawn':
    case 'refundedInRange':
      return colors.inRangeColor
    case 'outOfRange':
      return colors.outOfRangeColor
    default:
      return colors.neutralColor
  }
}
