import { useState } from 'react'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getRateToDisplay } from 'uniswap/src/features/transactions/swap/utils/trade'
import { NumberType } from 'utilities/src/format/types'

type SwapRateRatioProps = {
  trade: Trade | IndicativeTrade | undefined | null
  styling?: 'primary' | 'secondary'
  initialInverse?: boolean
}
export function SwapRateRatio({
  trade,
  styling = 'primary',
  initialInverse = false,
}: SwapRateRatioProps): JSX.Element | null {
  const formatter = useLocalizationContext()
  const { convertFiatAmountFormatted } = formatter

  const [showInverseRate, setShowInverseRate] = useState(initialInverse)

  const latestPrice = trade?.executionPrice
  const latestFiatPriceFormatted = convertFiatAmountFormatted(latestPrice?.toSignificant(), NumberType.FiatTokenPrice)
  const latestRate = trade && getRateToDisplay(formatter, trade, showInverseRate)
  const isPrimary = styling === 'primary'

  if (!trade) {
    return null
  }

  return (
    <Flex pressStyle={{ opacity: 0.2 }} onPress={(): void => setShowInverseRate(!showInverseRate)}>
      <Text adjustsFontSizeToFit color={isPrimary ? '$neutral1' : '$neutral2'} numberOfLines={1} variant="body3">
        {latestRate}
        {latestPrice && (
          <Text color={isPrimary ? '$neutral1' : '$neutral3'} variant="body3">
            ({latestFiatPriceFormatted})
          </Text>
        )}
      </Text>
    </Flex>
  )
}
