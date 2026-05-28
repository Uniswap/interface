import { Currency } from '@uniswap/sdk-core'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useUSDCValueWithStatus } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { NumberType } from 'utilities/src/format/types'

export function useFormattedCurrencyAmountAndUSDValue({
  currency,
  currencyAmountRaw,
  formatter,
  isApproximateAmount = false,
  valueType = ValueType.Raw,
  isUniswapX = false,
  pollInterval = PollingInterval.Fast,
}: {
  currency: Maybe<Currency>
  currencyAmountRaw: string | undefined
  formatter: LocalizationContextState
  isApproximateAmount?: boolean
  valueType?: ValueType
  isUniswapX?: boolean
  pollInterval?: PollingInterval
}): { amount: string; value: string; tilde: string; isLoading: boolean } {
  const currencyAmount = getCurrencyAmount({
    value: currencyAmountRaw,
    valueType,
    currency,
  })

  const { value, isLoading } = useUSDCValueWithStatus(currencyAmount, pollInterval)

  if (isUniswapX) {
    return {
      tilde: '',
      amount: `${formatter.formatNumberOrString({ value: 0 })}`,
      value: formatter.convertFiatAmountFormatted(0, NumberType.FiatTokenQuantity),
      isLoading: false,
    }
  }

  const formattedAmount = formatter.formatCurrencyAmount({ value: currencyAmount })

  return {
    tilde: isApproximateAmount ? '~' : '',
    amount: formattedAmount,
    value: value
      ? formatter.convertFiatAmountFormatted(parseFloat(value.toExact()), NumberType.FiatTokenQuantity)
      : '-',
    isLoading,
  }
}
