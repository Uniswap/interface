import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { TOOLTIP_CONFIG } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { formatTickForDisplay } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'
import { BidTokenInfo } from '~/components/Toucan/Auction/store/types'
import { TooltipContainer } from '~/components/Toucan/Shared/TooltipContainer'

interface ChartBarTooltipProps {
  left: number
  top: number
  isVisible: boolean
  tickValue: number
  volumeAmount: number
  totalVolume: number
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals: number
  formatter: (amount: number) => string
  volumeFormatter: (amount: number) => string
}

/**
 * React component for chart bar tooltip that shows when user hovers over chart bars.
 * Matches the styling pattern of BidLineTooltip for consistency.
 */
export const ChartBarTooltip = forwardRef<HTMLDivElement, ChartBarTooltipProps>(function ChartBarTooltip(
  {
    left,
    top,
    isVisible,
    tickValue,
    volumeAmount,
    totalVolume,
    bidTokenInfo,
    totalSupply,
    auctionTokenDecimals,
    formatter,
    volumeFormatter,
  },
  ref,
) {
  const { t } = useTranslation()

  if (!isVisible) {
    return null
  }

  const fdvText = t('stats.fdv')
  const tickDisplay = formatTickForDisplay({
    tickValue,
    bidTokenInfo,
    totalSupply,
    auctionTokenDecimals,
    formatter,
  })
  const fdvDisplay = `${tickDisplay} ${fdvText}`

  // For zero-volume ticks, only show FDV
  const showVolumeSection = volumeAmount > 0

  // Calculate volume display and percentage
  const volumeDisplay = volumeFormatter(volumeAmount)
  const clampedTotal = totalVolume > 0 ? totalVolume : 0
  const rawPercent = clampedTotal === 0 ? 0 : (volumeAmount / clampedTotal) * 100
  const safePercent = Math.min(100, Math.max(0, rawPercent))
  const precision = safePercent >= 10 ? 0 : 1
  const volumePercent = `${safePercent.toFixed(precision)}%`

  return (
    <TooltipContainer
      ref={ref}
      zIndex={zIndexes.tooltip}
      py="$spacing4"
      px="$spacing6"
      gap="$spacing4"
      minWidth={100}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: `translate(0, -${TOOLTIP_CONFIG.VERTICAL_OFFSET_PERCENT}%)`,
        whiteSpace: 'nowrap',
      }}
    >
      {/* FDV header line */}
      <Text variant="body4" color="$neutral2">
        {fdvDisplay}
      </Text>

      {showVolumeSection && (
        <>
          {/* Divider */}
          <Flex width="100%" height={1} backgroundColor="$surface3" />

          {/* Volume info */}
          <Flex gap="$spacing2">
            <Text variant="body4" color="$neutral1">
              {t('toucan.bidDistribution.volumeInBids', {
                value: `${volumeDisplay} ${bidTokenInfo.symbol}`,
              })}
            </Text>
            <Text variant="body4" color="$neutral2" lineHeight={14}>
              {t('toucan.bidDistribution.volumeShare', {
                value: volumePercent,
              })}
            </Text>
          </Flex>
        </>
      )}
    </TooltipContainer>
  )
})
