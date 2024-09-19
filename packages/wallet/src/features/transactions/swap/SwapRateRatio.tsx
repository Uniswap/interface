import { useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCPrice } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { NumberType } from 'utilities/src/format/types'
import { getRateToDisplay } from 'wallet/src/features/transactions/swap/utils'

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
  const latestUSDPrice = useUSDCPrice(showInverseRate ? latestPrice?.quoteCurrency : latestPrice?.baseCurrency)
  const latestFiatPriceFormatted = convertFiatAmountFormatted(
    latestUSDPrice?.toSignificant(),
    NumberType.FiatTokenPrice,
  )
  const latestRate = trade && getRateToDisplay(formatter, trade, showInverseRate)
  const isPrimary = styling === 'primary'

  if (!trade) {
    return null
  }

  return (
    <TouchableOpacity onPress={(): void => setShowInverseRate(!showInverseRate)}>
      <Text
        adjustsFontSizeToFit
        color={isPrimary ? '$neutral1' : '$neutral2'}
        numberOfLines={1}
        variant={isPrimary ? 'body3' : 'body4'}
      >
        {latestRate}
        <Text color={isPrimary ? '$neutral1' : '$neutral3'} variant={isPrimary ? 'body3' : 'body4'}>
          {latestUSDPrice && ` (${latestFiatPriceFormatted})`}
        </Text>
      </Text>
    </TouchableOpacity>
  )
}
