import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import type { ClearingPriceChartPoint } from '~/components/Charts/ToucanChart/clearingPrice/types'
import type { BidTokenInfo } from '~/components/Toucan/Auction/store/types'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'

interface ClearingPriceTooltipBodyProps {
  data: ClearingPriceChartPoint
  bidTokenInfo: BidTokenInfo
  maxFractionDigits: number
  scaleFactor: number
}

/**
 * Tooltip content for the clearing price chart.
 * Displays the price in bid token (with subscript notation for small values)
 * and its fiat equivalent.
 */
export function ClearingPriceTooltipBody({
  data,
  bidTokenInfo,
  scaleFactor,
}: ClearingPriceTooltipBodyProps): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // Unscale the value (chart data is scaled for Y-axis display)
  const originalValue = data.value / scaleFactor

  const fiatValue = useMemo(() => {
    const fiatAmount = originalValue * bidTokenInfo.priceFiat
    return convertFiatAmountFormatted(fiatAmount, NumberType.FiatTokenPrice)
  }, [originalValue, bidTokenInfo.priceFiat, convertFiatAmountFormatted])

  return (
    <Flex flexDirection="column" gap="$gap2">
      <SubscriptZeroPrice
        value={originalValue}
        symbol={bidTokenInfo.symbol}
        minSignificantDigits={2}
        maxSignificantDigits={4}
        subscriptThreshold={4}
        variant="body3"
        color="$neutral1"
      />
      <Text variant="body4" color="$neutral2">
        {fiatValue}
      </Text>
    </Flex>
  )
}
