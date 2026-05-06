import { Flex, SpinningLoader, useSporeColors } from 'ui/src'
import { getDisplayStateColor, useBidStatusColors } from '~/features/Toucan/Auction/hooks/useBidStatusColors'
import { type BidDisplayState } from '~/features/Toucan/Auction/utils/bidDetails'

const SIZE = 16
const STROKE_WIDTH = 2.5
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const DOT_RADIUS = 2.5

interface BidProgressIndicatorProps {
  displayState: BidDisplayState
  fillFraction: number
}

export function BidProgressIndicator({ displayState, fillFraction }: BidProgressIndicatorProps): JSX.Element {
  const bidStatusColors = useBidStatusColors()
  const colors = useSporeColors()

  if (displayState === 'pending') {
    return (
      <Flex width={SIZE} height={SIZE} alignItems="center" justifyContent="center">
        <SpinningLoader size={SIZE} color="$neutral2" unstyled />
      </Flex>
    )
  }

  const strokeColor = getDisplayStateColor(displayState, bidStatusColors)
  const trackColor = colors.surface3.val
  const clampedFill = Math.max(0, Math.min(1, fillFraction))
  const dashOffset = CIRCUMFERENCE * (1 - clampedFill)

  return (
    <Flex width={SIZE} height={SIZE} alignItems="center" justifyContent="center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={trackColor} strokeWidth={STROKE_WIDTH} />
        {/* Center dot */}
        <circle cx={SIZE / 2} cy={SIZE / 2} r={DOT_RADIUS} fill={strokeColor} />
        {/* Progress arc */}
        {clampedFill > 0 && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        )}
      </svg>
    </Flex>
  )
}
