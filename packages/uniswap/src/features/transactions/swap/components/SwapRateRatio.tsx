import { useState } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
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
  const priceUXEnabled = usePriceUXEnabled()
  const formatter = useLocalizationContext()
  const [showInverseRate, setShowInverseRate] = useState(initialInverse)

  const { outputCurrencyAmount } = getTradeAmounts(derivedSwapInfo, priceUXEnabled)
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

  return (
    <TouchableArea
      group
      flexDirection="row"
      justifyContent={justifyContent}
      flexGrow={1}
      onPress={() => setShowInverseRate(!showInverseRate)}
    >
      <Flex row width="max-content">
        <Text
          adjustsFontSizeToFit
          $group-hover={{ color: isPrimary ? '$neutral1Hovered' : '$neutral2Hovered' }}
          color={isPrimary ? '$neutral1' : '$neutral2'}
          numberOfLines={1}
          variant="body3"
        >
          {latestRate}
        </Text>
        <Text
          $group-hover={{ color: isPrimary ? '$neutral1Hovered' : '$neutral3Hovered' }}
          color={isPrimary ? '$neutral2' : '$neutral3'}
          variant="body3"
        >
          {rateAmountUSD && ` (${rateAmountUSD})`}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
