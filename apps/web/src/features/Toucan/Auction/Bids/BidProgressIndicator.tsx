import { Flex, ProgressRing, SpinningLoader } from '@universe/mycelium'
import { getDisplayStateColor, useBidStatusColors } from '~/features/Toucan/Auction/hooks/useBidStatusColors'
import { type BidDisplayState } from '~/features/Toucan/Auction/utils/bidDetails'

const SIZE = 16
const STROKE_WIDTH = 2.5
const DOT_SIZE = 5

interface BidProgressIndicatorProps {
  displayState: BidDisplayState
  fillFraction: number
}

export function BidProgressIndicator({ displayState, fillFraction }: BidProgressIndicatorProps): JSX.Element {
  const bidStatusColors = useBidStatusColors()

  if (displayState === 'pending') {
    return (
      <Flex width={SIZE} height={SIZE} alignItems="center" justifyContent="center">
        <SpinningLoader size={SIZE} color="$neutral2" unstyled />
      </Flex>
    )
  }

  const strokeColor = getDisplayStateColor(displayState, bidStatusColors)

  return (
    <Flex width={SIZE} height={SIZE} alignItems="center" justifyContent="center">
      <ProgressRing size={SIZE} strokeWidth={STROKE_WIDTH} progress={fillFraction} color={strokeColor} />
      <Flex
        position="absolute"
        width={DOT_SIZE}
        height={DOT_SIZE}
        borderRadius="$roundedFull"
        backgroundColor={strokeColor}
      />
    </Flex>
  )
}
