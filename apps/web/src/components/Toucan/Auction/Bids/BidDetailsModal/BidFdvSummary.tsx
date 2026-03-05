import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { FdvArrowMarker } from '~/components/Toucan/Auction/Bids/BidDetailsModal/FdvArrowMarker'
import { useBidStatusColors } from '~/components/Toucan/Auction/hooks/useBidStatusColors'
import { type BidDisplayState } from '~/components/Toucan/Auction/utils/bidDetails'
import { ProgressBar } from '~/components/Toucan/Shared/ProgressBar'

interface BidFdvSummaryProps {
  currentFdvDisplay: string
  maxFdvDisplay: string
  fdvFraction: number
  displayState: BidDisplayState
}

const FdvArrow = styled(Flex, {
  position: 'absolute',
  top: -10,
})

export function BidFdvSummary({
  currentFdvDisplay,
  maxFdvDisplay,
  fdvFraction,
  displayState,
}: BidFdvSummaryProps): JSX.Element {
  const { t } = useTranslation()
  const { inRangeColor, warningColor, outOfRangeColor } = useBidStatusColors()
  const currentFdvColor = displayState === 'outOfRange' ? outOfRangeColor : '$neutral1'

  const fdvGradient = useMemo(() => {
    return `linear-gradient(90deg, ${inRangeColor} 0%, ${warningColor} 50%, ${outOfRangeColor} 100%)`
  }, [inRangeColor, outOfRangeColor, warningColor])

  const arrowLeft = useMemo(() => `calc(${Math.min(Math.max(fdvFraction, 0), 1) * 100}% - 6px)`, [fdvFraction])

  return (
    <Flex flex={1} minWidth={0} flexBasis={0} gap="$spacing12">
      <Flex row justifyContent="space-between" gap="$spacing8">
        <Flex gap="$spacing2">
          <Text variant="body4" color="$neutral2">
            {t('toucan.bidDetails.label.currentFdv')}
          </Text>
          <Text variant="body3" color={currentFdvColor}>
            {currentFdvDisplay}
          </Text>
        </Flex>
        <Flex gap="$spacing2" alignItems="flex-end">
          <Text variant="body4" color="$neutral2">
            {t('toucan.bidDetails.label.maxFdv')}
          </Text>
          <Text variant="body3" color="$neutral1">
            {maxFdvDisplay}
          </Text>
        </Flex>
      </Flex>
      <Flex position="relative">
        <ProgressBar
          percentage={100}
          color={inRangeColor}
          borderColor="$surface3"
          height={8}
          showWhiteDot={false}
          showEndDots={false}
          customFillStyle={{ backgroundImage: fdvGradient }}
          shouldAnimate={false}
        />
        <FdvArrow style={{ left: arrowLeft }}>
          <FdvArrowMarker />
        </FdvArrow>
      </Flex>
    </Flex>
  )
}
