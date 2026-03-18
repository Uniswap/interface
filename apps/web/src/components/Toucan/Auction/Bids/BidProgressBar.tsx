import { Flex, Text, useSporeColors } from 'ui/src'
import { colorsDark } from 'ui/src/theme/color/colors'
import {
  GRADIENT_BADGE_BORDER_COLOR,
  GRADIENT_BORDER_COLOR,
  GRADIENT_END_COLOR,
  GRADIENT_START_COLOR,
  useBidStatusColors,
} from '~/components/Toucan/Auction/hooks/useBidStatusColors'
import { type BidDisplayState } from '~/components/Toucan/Auction/utils/bidDetails'

interface BidProgressBarProps {
  fillFraction: number
  percentage: string
  displayState: BidDisplayState
  isAuctionInProgress: boolean
  isComplete: boolean // Whether bid is 100% filled
}

export function BidProgressBar({
  fillFraction,
  percentage,
  displayState,
  isAuctionInProgress,
  isComplete,
}: BidProgressBarProps): JSX.Element {
  const { inRangeColor, outOfRangeColor, isClaimedColor } = useBidStatusColors()
  const colors = useSporeColors()

  const clampedFill = Math.max(0, Math.min(1, fillFraction))
  const fillWidth = `${clampedFill * 100}%`
  const hasProgress = clampedFill > 0
  const isLessThanOnePercent = clampedFill > 0 && clampedFill < 0.01
  const percentageDisplay = isLessThanOnePercent ? '<1%' : percentage

  // Determine if this bid should use in-range styling (green)
  const isInRange = displayState === 'inRange' || displayState === 'complete' || displayState === 'refundedInRange'
  const isWithdrawn = displayState === 'withdrawn'
  const isPending = displayState === 'pending'

  // Determine if we should show the green gradient (only during auction for in-range bids that aren't complete)
  const showInRangeAuctionGradient = isInRange && isAuctionInProgress && !isComplete

  const fillColor = showInRangeAuctionGradient
    ? undefined
    : isWithdrawn
      ? isClaimedColor
      : isInRange
        ? inRangeColor
        : outOfRangeColor

  const fillStyle: React.CSSProperties = {
    width: fillWidth,
    // Must explicitly set 'none' (not undefined) to clear the gradient when transitioning
    // from in-range to out-of-range, otherwise the gradient persists
    background: showInRangeAuctionGradient
      ? `linear-gradient(90deg, ${GRADIENT_START_COLOR} 0%, ${GRADIENT_END_COLOR} 100%)`
      : 'none',
    border: showInRangeAuctionGradient ? `1px solid ${GRADIENT_BORDER_COLOR}` : undefined,
    backgroundColor: showInRangeAuctionGradient ? undefined : fillColor,
  }

  // Badge colors:
  // - During auction, in-range bids use green bg
  // - Otherwise use theme-aware scrim (darker in light mode, lighter in dark mode)
  const badgeStyle = showInRangeAuctionGradient
    ? {
        backgroundColor: inRangeColor,
        borderWidth: 1,
        borderColor: GRADIENT_BADGE_BORDER_COLOR,
      }
    : {}

  // Use scrim (60% black) for non-gradient badge background
  const isOutOfRangeAuction = !isInRange && isAuctionInProgress && !isPending
  const badgeBgColor = showInRangeAuctionGradient ? undefined : isOutOfRangeAuction ? outOfRangeColor : '$scrim'
  // Badge text: use dark text only when gradient is shown (green background), white otherwise
  const useThemeAwareText = showInRangeAuctionGradient
  const badgeTextColor = useThemeAwareText ? colors.surface1.val : colorsDark.neutral1

  // Calculate badge position and transform based on fill percentage
  // At 0%: badge left edge aligns with progress bar left edge (translateX 0%)
  // At 100%: badge right edge aligns with progress bar right edge (translateX -100%)
  // This mirrors how SliderThumb works in BidMaxValuationSlider
  const badgeLeft = `${clampedFill * 100}%`
  const badgeTranslateX = `${-clampedFill * 100}%`

  return (
    <Flex position="relative" height={12} alignItems="center" marginTop={3} flex={1}>
      <Flex
        position="relative"
        width="100%"
        height={6}
        borderRadius="$roundedFull"
        overflow={showInRangeAuctionGradient ? 'visible' : 'hidden'}
        backgroundColor="$surface2"
        borderWidth={1}
        borderColor="$surface3Hovered"
      >
        {hasProgress && (
          <>
            <Flex
              height={showInRangeAuctionGradient ? 6 : '100%'}
              borderRadius="$roundedFull"
              position="absolute"
              left={0}
              top={showInRangeAuctionGradient ? -1.4 : 0}
              style={fillStyle}
            />
          </>
        )}
      </Flex>
      {/* Badge positioned at the end of the fill */}
      <Flex
        position="absolute"
        top="50%"
        borderRadius="$rounded4"
        p="$spacing2"
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        backgroundColor={badgeBgColor}
        style={{
          ...badgeStyle,
          left: badgeLeft,
          transform: `translate(${badgeTranslateX}, -70%)`,
        }}
      >
        <Text variant="body4" color={badgeTextColor} fontSize={10} lineHeight={12}>
          {percentageDisplay}
        </Text>
      </Flex>
    </Flex>
  )
}
