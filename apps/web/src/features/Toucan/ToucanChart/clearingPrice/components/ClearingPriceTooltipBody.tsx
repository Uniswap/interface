import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { formatTickForDisplay } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'
import type { BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { formatCompactFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { formatTimestampToDate } from '~/features/Toucan/Auction/utils/formatting'
import type { ClearingPriceChartPoint } from '~/features/Toucan/ToucanChart/clearingPrice/types'

interface ClearingPriceTooltipBodyProps {
  data: ClearingPriceChartPoint
  bidTokenInfo: BidTokenInfo
  scaleFactor: number
  totalSupply?: string
  auctionTokenDecimals?: number
  isPreBidEnd?: boolean
}

/**
 * Tooltip content for the clearing price chart.
 * Displays the date, price in bid token (with subscript notation for small values),
 * its fiat equivalent, and FDV when available.
 */
export function ClearingPriceTooltipBody({
  data,
  bidTokenInfo,
  scaleFactor,
  totalSupply,
  auctionTokenDecimals,
  isPreBidEnd,
}: ClearingPriceTooltipBodyProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // Unscale the value (chart data is scaled for Y-axis display)
  const originalValue = data.value / scaleFactor

  const fiatValue = useMemo(() => {
    const fiatAmount = originalValue * bidTokenInfo.priceFiat
    return convertFiatAmountFormatted(fiatAmount, NumberType.FiatTokenPrice)
  }, [originalValue, bidTokenInfo.priceFiat, convertFiatAmountFormatted])

  const dateStr = formatTimestampToDate(BigInt(data.time))

  // FDV: price per auction token * total supply
  const fdvDisplay = useMemo(() => {
    if (!totalSupply || auctionTokenDecimals == null) {
      return null
    }
    const formattedFiat = formatTickForDisplay({
      tickValue: originalValue,
      bidTokenInfo,
      totalSupply,
      auctionTokenDecimals,
      formatter: (amount) => convertFiatAmountFormatted(amount, NumberType.FiatTokenStats),
    })

    const supply = Number(totalSupply) / 10 ** auctionTokenDecimals
    if (!supply || !Number.isFinite(supply)) {
      return null
    }
    const fdvInBidToken = originalValue * supply
    const fdvRaw = BigInt(Math.round(fdvInBidToken * 10 ** bidTokenInfo.decimals))
    const formattedBidToken = `${formatCompactFromRaw({ raw: fdvRaw, decimals: bidTokenInfo.decimals, maxFractionDigits: 1 })} ${bidTokenInfo.symbol}`

    return { fiat: formattedFiat, bidToken: formattedBidToken }
  }, [originalValue, totalSupply, auctionTokenDecimals, bidTokenInfo, convertFiatAmountFormatted])

  return (
    <Flex flexDirection="column" gap="$gap4">
      {/* Date */}
      <Text variant="body4" color="$neutral1">
        {dateStr}
      </Text>

      {/* Pre-bidding ended label — shown at the boundary between pre-bid and clearing */}
      {isPreBidEnd && (
        <Text variant="body4" color="$neutral2">
          {t('toucan.auction.chart.preBiddingEnded')}
        </Text>
      )}

      {/* Divider */}
      <Flex width="100%" height={1} backgroundColor="$surface3" />

      {/* Price line: "Price: $X.XX (0.00004 ETH)" */}
      <Flex row alignItems="baseline" gap="$gap4">
        <Text variant="body4" color="$neutral2">
          {t('toucan.bidDistribution.tabs.clearingPriceChart')}:
        </Text>
        <Text variant="body4" color="$neutral1">
          {fiatValue}
        </Text>
        <SubscriptZeroPrice
          prefix="("
          value={originalValue}
          symbol={`${bidTokenInfo.symbol})`}
          minSignificantDigits={2}
          maxSignificantDigits={4}
          subscriptThreshold={4}
          variant="body4"
          color="$neutral2"
        />
      </Flex>

      {/* FDV line */}
      {fdvDisplay && (
        <Flex row alignItems="baseline" gap="$gap4">
          <Text variant="body4" color="$neutral2">
            {t('stats.fdv')}:
          </Text>
          <Text variant="body4" color="$neutral1">
            {fdvDisplay.fiat}
          </Text>
          <Text variant="body4" color="$neutral2">
            ({fdvDisplay.bidToken})
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
