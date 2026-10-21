import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import { useState } from 'react'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getTradeAmounts } from 'uniswap/src/features/transactions/swap/utils/getTradeAmounts'
import { calculateRateLine, getRateToDisplay } from 'uniswap/src/features/transactions/swap/utils/trade'

type SwapRateRatioProps = {
  trade: Trade | IndicativeTrade | undefined | null
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  styling?: 'primary' | 'secondary'
  initialInverse?: boolean
  justifyContent?: 'flex-end' | 'flex-start'
}
export function SwapRateRatio({
  trade,
  derivedSwapInfo,
  styling = 'primary',
  initialInverse = false,
  justifyContent = 'flex-start',
}: SwapRateRatioProps): JSX.Element | null {
  const formatter = useLocalizationContext()
  const [showInverseRate, setShowInverseRate] = useState(initialInverse)

  const { outputCurrencyAmount } = getTradeAmounts(derivedSwapInfo)
  const usdAmountOut = useUSDCValue(outputCurrencyAmount)

  const latestFiatPriceFormatted = calculateRateLine({
    usdAmountOut,
    outputCurrencyAmount,
    trade,
    showInverseRate,
    formatter,
  })

  const latestRate = trade ? getRateToDisplay({ formatter, trade, showInverseRate }) : null
  const rateAmountUSD = latestFiatPriceFormatted
  const isPrimary = styling === 'primary'

  if (!trade) {
    return null
  }

  // `maxContent` keeps this row at its natural width when there's room (so the
  // rate/gas display doesn't look oddly stretched), but without `shrink` it also
  // has flex-shrink:0 by default — meaning it could never compress below that
  // natural width, so an extreme-length rate (e.g. a memecoin with a huge
  // ETH-denominated price) would overflow into whatever sits next to it instead of
  // respecting the numberOfLines=1 ellipsis below. `shrink` lets it give up that
  // width under pressure so the ellipsis can actually take effect.
  //
  // `flexWrap="wrap"` is a fallback for the rare case where even an abbreviated,
  // ellipsized rate plus the "(~$X)" USD amount still can't both fit on one line
  // (e.g. a long ticker symbol alongside a gas-sponsorship icon). Rather than the
  // USD text getting clipped or overlapping its neighbor, it drops to its own
  // second line below the rate -- the rate itself still never wraps, since its
  // own `numberOfLines={1}` keeps it single-line and ellipsizes first.
  const rateRow = (
    <Flex row maxContent shrink flexWrap="wrap">
      <Text adjustsFontSizeToFit color={isPrimary ? '$neutral1' : '$neutral2'} numberOfLines={1} variant="body3">
        {latestRate?.rate}
      </Text>
      <Text color={isPrimary ? '$neutral2' : '$neutral3'} variant="body3">
        {rateAmountUSD && ` (${rateAmountUSD})`}
      </Text>
    </Flex>
  )

  return (
    <TouchableArea
      flexDirection="row"
      justifyContent={justifyContent}
      flexGrow={1}
      flexShrink={1}
      onPress={() => setShowInverseRate(!showInverseRate)}
    >
      {latestRate?.fullPrecisionRate ? (
        // The rate abbreviates once it's this large (e.g. "1.24B") -- surface the exact,
        // un-abbreviated value on hover rather than only in the ellipsized/shortened text.
        <Tooltip placement="top">
          <Tooltip.Trigger asChild>{rateRow}</Tooltip.Trigger>
          <Tooltip.Content>
            <Tooltip.Arrow />
            <Text variant="body4" color="$neutral1">
              {latestRate.fullPrecisionRate}
            </Text>
          </Tooltip.Content>
        </Tooltip>
      ) : (
        rateRow
      )}
    </TouchableArea>
  )
}
