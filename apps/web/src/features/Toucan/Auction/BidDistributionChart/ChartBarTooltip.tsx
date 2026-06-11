import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { formatUnits } from '~/chains'
import { TOOLTIP_CONFIG } from '~/features/Toucan/Auction/BidDistributionChart/constants'
import {
  interpolateCurrencyRequiredQ96,
  interpolateFillRatio,
} from '~/features/Toucan/Auction/BidDistributionChart/utils/interpolateCurrencyRequired'
import { Q96 } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { formatTokenVolume } from '~/features/Toucan/Auction/BidDistributionChart/utils/tokenFormatters'
import { formatTickForDisplay } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'
import { BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { TooltipContainer } from '~/features/Toucan/Shared/TooltipContainer'

interface ChartBarTooltipProps {
  left: number
  top: number
  isVisible: boolean
  tickValue: number
  volumeAmount: number
  totalVolume: number
  tickQ96?: string
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
    tickQ96,
    bidTokenInfo,
    totalSupply,
    auctionTokenDecimals,
    formatter,
    volumeFormatter,
  },
  ref,
) {
  const { t } = useTranslation()
  const isTickDetailsTooltipEnabled = useFeatureFlag(FeatureFlags.ToucanTickDetailsTooltip)
  const tickDetails = useAuctionStore((state) => state.tickDetails)

  if (!isVisible) {
    return null
  }

  const remainingQ96 =
    isTickDetailsTooltipEnabled && tickQ96 ? interpolateCurrencyRequiredQ96({ ticks: tickDetails, tickQ96 }) : null
  // currencyRequiredQ96 is Q96-scaled raw bid-token units (per BE's TickDetailsBL):
  // currencyRequiredQ96 / Q96 yields the raw amount in the token's smallest unit (e.g. wei / USDC micro-units),
  // which is then converted to a human-readable string via formatUnits with the bid token's decimals.
  let remainingRaw: bigint | null = null
  try {
    if (remainingQ96 !== null) {
      remainingRaw = (BigInt(remainingQ96) + Q96 / 2n) / Q96
    }
  } catch {
    // invalid Q96 string — skip the remaining display
  }
  const remainingFormatUnits = remainingRaw !== null ? formatUnits(remainingRaw, bidTokenInfo.decimals) : null
  const remainingDisplay =
    remainingFormatUnits !== null
      ? formatTokenVolume(Number.parseFloat(remainingFormatUnits), { maxDecimals: 3 })
      : null

  const fillRatio =
    isTickDetailsTooltipEnabled && tickQ96 ? interpolateFillRatio({ ticks: tickDetails, tickQ96 }) : null
  const fillPercentDisplay = fillRatio !== null ? Math.round(fillRatio * 100).toString() : null

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

      {(remainingDisplay !== null || fillPercentDisplay !== null) && (
        <>
          <Flex width="100%" height={1} backgroundColor="$surface3" />
          <Flex gap="$spacing2">
            {remainingDisplay !== null && remainingRaw !== null && remainingRaw > 0n && (
              <Text variant="body4" color="$neutral2">
                {t('toucan.bidDistribution.remaining', {
                  value: `${remainingDisplay} ${bidTokenInfo.symbol}`,
                })}
              </Text>
            )}
            {fillPercentDisplay !== null && (
              <Text variant="body4" color="$neutral2">
                {t('toucan.bidDistribution.fillPercent', { value: fillPercentDisplay })}
              </Text>
            )}
          </Flex>
        </>
      )}
    </TooltipContainer>
  )
})
