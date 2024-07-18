import { Currency } from '@uniswap/sdk-core'
import { NumberType } from 'utilities/src/format/types'
import { LocalizationContextState } from 'wallet/src/features/language/LocalizationContext'
import { useUSDCValue } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

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
      value: formatter.formatNumberOrString({ value: 0, type: NumberType.FiatGasPrice }),
    }
  }

  const formattedAmount = formatter.formatCurrencyAmount({ value: currencyAmount })
  return {
    tilde: isApproximateAmount ? '~' : '',
    amount: `${formattedAmount}`,
    value: formatter.formatCurrencyAmount({ value, type: NumberType.FiatGasPrice }),
  }
}

export function shortenHash(hash: string | undefined, chars: NumberRange<1, 20> = 4): string {
  if (!hash) {
    return ''
  }
  return `${hash.substring(0, chars + 2)}...${hash.substring(hash.length - chars)}`
}
