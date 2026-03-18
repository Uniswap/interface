import { ColorTokens, Flex, SpinningLoader } from 'ui/src'
import { ArrowUpCircle } from 'ui/src/components/icons/ArrowUpCircle'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { useBidStatusColors } from '~/components/Toucan/Auction/hooks/useBidStatusColors'
import { type BidDisplayState } from '~/components/Toucan/Auction/utils/bidDetails'

const INDICATOR_SIZE = 12
const IN_RANGE_DOT_SIZE = 8
const OUT_OF_RANGE_DOT_SIZE = 6

interface BidStatusIndicatorProps {
  displayState: BidDisplayState
  isComplete: boolean
}

interface StatusDotProps {
  dotSize: number
  dotColor: ColorTokens | string
  borderColor?: ColorTokens
  backgroundColor?: ColorTokens
}

function StatusDot({ dotSize, dotColor, borderColor, backgroundColor }: StatusDotProps): JSX.Element {
  return (
    <Flex
      width={INDICATOR_SIZE}
      height={INDICATOR_SIZE}
      borderRadius="$roundedFull"
      alignItems="center"
      justifyContent="center"
      borderWidth={borderColor ? 2 : undefined}
      borderColor={borderColor}
      backgroundColor={backgroundColor}
    >
      <Flex width={dotSize} height={dotSize} borderRadius="$roundedFull" backgroundColor={dotColor} />
    </Flex>
  )
}

export function BidStatusIndicator({ displayState, isComplete }: BidStatusIndicatorProps): JSX.Element {
  const { inRangeColor, outOfRangeColor } = useBidStatusColors()

  switch (displayState) {
    case 'pending':
      return (
        <Flex width={INDICATOR_SIZE} height={INDICATOR_SIZE} alignItems="center" justifyContent="center">
          <SpinningLoader size={INDICATOR_SIZE} color="$neutral2" unstyled />
        </Flex>
      )

    case 'fundsAvailable':
      // Auction failed to graduate - grey dot
      return <StatusDot dotSize={OUT_OF_RANGE_DOT_SIZE} dotColor="$neutral3" borderColor="$surface2" />

    case 'withdrawn':
      // Claimed - grey arrow (tokens withdrawn)
      return <ArrowUpCircle size={INDICATOR_SIZE} color="$neutral2" />

    case 'refundedInRange':
      // Refunded while in range - green dot (badge indicates refunded)
      return <StatusDot dotSize={IN_RANGE_DOT_SIZE} dotColor={inRangeColor} backgroundColor="$statusSuccess2" />

    case 'refundedOutOfRange':
      // Refunded while out of range - red dot (badge indicates refunded)
      return <StatusDot dotSize={OUT_OF_RANGE_DOT_SIZE} dotColor={outOfRangeColor} borderColor="$surface2" />

    case 'complete':
      // Fully filled - green checkmark
      return <CheckCircleFilled size={INDICATOR_SIZE} color={inRangeColor} />

    case 'inRange':
      // In range - green dot, or checkmark if 100% complete
      if (isComplete) {
        return <CheckCircleFilled size={INDICATOR_SIZE} color={inRangeColor} />
      }
      return <StatusDot dotSize={IN_RANGE_DOT_SIZE} dotColor={inRangeColor} backgroundColor="$statusSuccess2" />

    case 'outOfRange':
      // Out of range - red dot
      return <StatusDot dotSize={OUT_OF_RANGE_DOT_SIZE} dotColor={outOfRangeColor} borderColor="$surface2" />
  }
}
