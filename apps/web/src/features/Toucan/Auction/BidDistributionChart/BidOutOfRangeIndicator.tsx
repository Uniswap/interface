import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { BID_OUT_OF_RANGE_INDICATOR } from '~/features/Toucan/Auction/BidDistributionChart/constants'
import { formatTickForDisplay } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'
import type { BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { TooltipContainer } from '~/features/Toucan/Shared/TooltipContainer'

interface BidOutOfRangeIndicatorProps {
  direction: 'up' | 'down'
  tickValue: number
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals: number
  formatter: (amount: number) => string
  onClick: () => void
}

/**
 * Shows "Your bid [FDV]" with an arrow pointing up or down when the user's bid
 * is outside the visible price range in the combined chart.
 */
export function BidOutOfRangeIndicator({
  direction,
  tickValue,
  bidTokenInfo,
  totalSupply,
  auctionTokenDecimals,
  formatter,
  onClick,
}: BidOutOfRangeIndicatorProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const arrowSize = BID_OUT_OF_RANGE_INDICATOR.ARROW_SIZE
  const arrowColor = colors.neutral2.val

  const fdvDisplay = formatTickForDisplay({
    tickValue,
    bidTokenInfo,
    totalSupply,
    auctionTokenDecimals,
    formatter,
  })
  const fdvLabel = t('stats.fdv')

  return (
    <TooltipContainer
      zIndex={zIndexes.mask}
      pointerEvents="auto"
      py="$spacing6"
      px="$spacing8"
      gap="$spacing4"
      alignItems="center"
      onPress={onClick}
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        ...(direction === 'up'
          ? { top: BID_OUT_OF_RANGE_INDICATOR.PADDING }
          : { bottom: BID_OUT_OF_RANGE_INDICATOR.PADDING }),
      }}
    >
      {/* Up arrow (shown first when direction is up) */}
      {direction === 'up' && (
        <Flex
          width={0}
          height={0}
          style={{
            borderLeft: `${arrowSize / 2}px solid transparent`,
            borderRight: `${arrowSize / 2}px solid transparent`,
            borderBottom: `${arrowSize}px solid ${arrowColor}`,
          }}
        />
      )}

      {/* Label and value */}
      <Text variant="body4" color="$neutral1" lineHeight={16}>
        {t('toucan.bidDistribution.yourBid')}
      </Text>
      <Text variant="body4" color="$neutral2" lineHeight={16}>
        {fdvDisplay} {fdvLabel}
      </Text>

      {/* Down arrow (shown last when direction is down) */}
      {direction === 'down' && (
        <Flex
          width={0}
          height={0}
          style={{
            borderLeft: `${arrowSize / 2}px solid transparent`,
            borderRight: `${arrowSize / 2}px solid transparent`,
            borderTop: `${arrowSize}px solid ${arrowColor}`,
          }}
        />
      )}
    </TooltipContainer>
  )
}
