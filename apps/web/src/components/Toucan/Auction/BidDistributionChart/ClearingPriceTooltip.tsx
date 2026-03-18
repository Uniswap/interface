import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { CLEARING_PRICE_LINE } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { useConcentrationColor } from '~/components/Toucan/Auction/BidDistributionChart/hooks/useConcentrationColor'
import { formatTickForDisplay } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'
import type { BidTokenInfo } from '~/components/Toucan/Auction/store/types'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'
import { TooltipContainer } from '~/components/Toucan/Shared/TooltipContainer'

interface ClearingPriceTooltipState {
  left: number
  top: number
  isVisible: boolean
  clearingPriceDecimal: number
  volumeAtClearingPrice: number
  totalBidVolume: number
}

interface ClearingPriceTooltipProps {
  state: ClearingPriceTooltipState
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals: number
  /** Override left position when stacked with BidLineTooltip */
  overrideLeft?: number
  /** Override top position when stacked with BidLineTooltip */
  overrideTop?: number
  /** When true, tooltip should appear to the left (used when stacking with flipped bid tooltip) */
  flipLeft?: boolean
  /** When true, shows "Final clearing price" instead of "Current clearing price" */
  isAuctionEnded?: boolean
}

/**
 * React component for the clearing price tooltip that shows when hovering on the clearing price line.
 * Shows: Triangle icon + "Current clearing price", FDV value, token price with subscript + fiat,
 * volume percentage, and bid volume at the clearing price tick.
 */
export const ClearingPriceTooltip = forwardRef<HTMLDivElement, ClearingPriceTooltipProps>(function ClearingPriceTooltip(
  { state, bidTokenInfo, totalSupply, auctionTokenDecimals, overrideLeft, overrideTop, flipLeft, isAuctionEnded },
  ref,
) {
  const { t } = useTranslation()
  const concentrationColor = useConcentrationColor()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  if (!state.isVisible) {
    return null
  }

  const { clearingPriceDecimal, volumeAtClearingPrice, totalBidVolume } = state

  // Format FDV value (e.g., "96,293.95")
  const fdvDisplay = formatTickForDisplay({
    tickValue: clearingPriceDecimal,
    bidTokenInfo,
    totalSupply,
    auctionTokenDecimals,
    formatter: (amount: number) => convertFiatAmountFormatted(amount, NumberType.FiatTokenStats),
  })

  // Format fiat price (e.g., "$0.36") - show "-" if price unavailable
  const fiatDisplay =
    bidTokenInfo.priceFiat === 0
      ? '-'
      : convertFiatAmountFormatted(clearingPriceDecimal * bidTokenInfo.priceFiat, NumberType.FiatTokenPrice)

  // Format volume percentage
  const volumePercent = totalBidVolume > 0 ? (volumeAtClearingPrice / totalBidVolume) * 100 : 0
  const precision = volumePercent >= 10 ? 0 : volumePercent >= 1 ? 1 : 2
  const volumePercentDisplay = t('toucan.bidDistribution.volumeShare', {
    value: `${volumePercent.toFixed(precision)}%`,
  })

  // Format bid volume (e.g., "$1.25M")
  const volumeDisplay = convertFiatAmountFormatted(volumeAtClearingPrice, NumberType.FiatTokenStats)

  // Use override positions when stacked, otherwise use default calculated positions
  const finalLeft = overrideLeft ?? state.left + CLEARING_PRICE_LINE.LABEL_OFFSET_X
  const finalTop = overrideTop ?? CLEARING_PRICE_LINE.LABEL_OFFSET_Y

  return (
    <TooltipContainer
      ref={ref}
      zIndex={3}
      minWidth={215}
      py="$spacing6"
      px="$spacing8"
      gap="$spacing8"
      style={{
        left: `${finalLeft}px`,
        top: `${finalTop}px`,
        transform: flipLeft ? 'translateX(-100%)' : 'none',
      }}
    >
      {/* Header row with triangle icon and title */}
      <Flex gap="$spacing2">
        <Flex row alignItems="center" gap="$spacing4">
          <TriangleIcon />
          <Text variant="body4" color="$neutral1">
            {isAuctionEnded ? t('toucan.statsBanner.finalClearingPrice') : t('toucan.statsBanner.clearingPrice')}
          </Text>
        </Flex>
      </Flex>

      {/* Divider line */}
      <Flex width="100%" height={1} backgroundColor="$surface3" />

      {/* Info section: FDV and price */}
      <Flex gap="$spacing2">
        {/* FDV row (e.g., "(96,293.95 ETH FDV)") */}
        <Text variant="body4" color="$neutral2" lineHeight={16}>
          ({fdvDisplay} {bidTokenInfo.symbol} FDV)
        </Text>

        {/* Price row: token price + fiat value */}
        <Flex row alignItems="center" gap="$spacing4">
          <SubscriptZeroPrice
            value={clearingPriceDecimal}
            symbol={bidTokenInfo.symbol}
            minSignificantDigits={2}
            maxSignificantDigits={4}
            variant="body4"
            color="$neutral1"
          />
          <Text variant="body4" color="$neutral2" lineHeight={16}>
            {fiatDisplay}
          </Text>
        </Flex>
      </Flex>

      {/* Meta section: volume info - only show if there's bid volume at this tick */}
      {volumeAtClearingPrice > 0 && (
        <Flex gap="$spacing2">
          {/* Bid volume row: dot + "Bid vol." on left, amount on right */}
          <Flex row alignItems="center" justifyContent="space-between">
            <Flex row alignItems="center" gap="$spacing4">
              <Flex width={8} height={8} borderRadius="$roundedFull" backgroundColor={concentrationColor} />
              <Text variant="body4" color="$neutral2" lineHeight={16}>
                {t('toucan.bidDistribution.bidVol')}
              </Text>
            </Flex>
            <Text variant="body4" color="$neutral1" lineHeight={16}>
              {volumeDisplay}
            </Text>
          </Flex>
          {/* Volume percentage row */}
          <Text variant="body4" color="$neutral2" lineHeight={16}>
            {volumePercentDisplay}
          </Text>
        </Flex>
      )}
    </TooltipContainer>
  )
})

/**
 * Small triangle icon that points right (rotated 90 degrees)
 */
function TriangleIcon() {
  return (
    <svg width="6" height="5" viewBox="0 0 6 5" fill="none" style={{ transform: 'rotate(90deg)', flexShrink: 0 }}>
      <path d="M3 0L5.59808 4.5H0.401924L3 0Z" fill="currentColor" stroke="currentColor" />
    </svg>
  )
}
