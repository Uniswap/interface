import { Currency } from '@uniswap/sdk-core'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

export function useFormattedCurrencyAmountAndUSDValue({
  currency,
  currencyAmountRaw,
  formatter,
  isApproximateAmount = false,
  valueType = ValueType.Raw,
  isUniswapX = false,
}: {
  currency: Maybe<Currency>
  currencyAmountRaw: string | undefined
  formatter: LocalizationContextState
  isApproximateAmount?: boolean
  valueType?: ValueType
  isUniswapX?: boolean
}): { amount: string; value: string; tilde: string } {
  const currencyAmount = getCurrencyAmount({
    value: currencyAmountRaw,
    valueType,
    currency,
  })

  const value = useUSDCValue(currencyAmount)

  if (isUniswapX) {
    return {
      tilde: '',
      amount: `${formatter.formatNumberOrString({ value: 0 })}`,
      value: formatter.convertFiatAmountFormatted(0, NumberType.FiatTokenQuantity),
    }
  }

  const formattedAmount = formatter.formatCurrencyAmount({ value: currencyAmount })

  return {
    tilde: isApproximateAmount ? '~' : '',
    amount: formattedAmount,
    value: value
      ? formatter.convertFiatAmountFormatted(parseFloat(value.toExact()), NumberType.FiatTokenQuantity)
      : '-', // default placeholder string for when value is loading
  }
}
