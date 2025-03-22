import { Currency } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { BridgeTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { NumberType } from 'utilities/src/format/types'
import { SwapTypeTransactionInfo } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'

const INTERFACE_FEE_SWITCH_TIMESTAMP = 1712772000000 // April 10th 2024 2pm EST

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
    amount: `${formattedAmount}`,
    value: value
      ? formatter.convertFiatAmountFormatted(parseFloat(value.toExact()), NumberType.FiatTokenQuantity)
      : '-', // default placeholder string for when value is loading
  }
}

export function shortenHash(hash: string | undefined, chars: NumberRange<1, 20> = 4): string {
  if (!hash) {
    return ''
  }
  return `${hash.substring(0, chars + 2)}...${hash.substring(hash.length - chars)}`
}

export function getFormattedSwapRatio({
  typeInfo,
  inputCurrency,
  outputCurrency,
  formatter,
}: {
  typeInfo: SwapTypeTransactionInfo | BridgeTransactionInfo
  inputCurrency: CurrencyInfo
  outputCurrency: CurrencyInfo
  formatter: LocalizationContextState
}): string {
  const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)

  const inputCurrencyAmount = getCurrencyAmount({
    value: inputCurrencyAmountRaw,
    valueType: ValueType.Raw,
    currency: inputCurrency.currency,
  })

  const outputCurrencyAmount = getCurrencyAmount({
    value: outputCurrencyAmountRaw,
    valueType: ValueType.Raw,
    currency: outputCurrency.currency,
  })

  const inputExactAmount = inputCurrencyAmount ? parseFloat(inputCurrencyAmount.toExact()) : 0
  const outputExactAmount = outputCurrencyAmount ? parseFloat(outputCurrencyAmount.toExact()) : 0

  const outputMoreValuable = inputExactAmount > outputExactAmount // If there are more input tokens per output token, then output token is worth more
  const swapRate = outputMoreValuable ? inputExactAmount / outputExactAmount : outputExactAmount / inputExactAmount
  const higherValueSymbol = outputMoreValuable ? outputCurrency.currency.symbol : inputCurrency.currency.symbol
  const lowerValueSymbol = outputMoreValuable ? inputCurrency.currency.symbol : outputCurrency.currency.symbol

  const formattedSwapRate = formatter.formatNumberOrString({
    value: swapRate,
    type: NumberType.TokenTx,
  })
  const formattedLine = '1 ' + higherValueSymbol + ' = ' + formattedSwapRate + ' ' + lowerValueSymbol

  return formattedLine
}

export function hasInterfaceFees({ swapTimestampMs }: { swapTimestampMs: number }): boolean {
  const beforeInterfaceFeeSwitch = swapTimestampMs < INTERFACE_FEE_SWITCH_TIMESTAMP
  if (beforeInterfaceFeeSwitch) {
    return false
  }

  // TODO (WALL-4189): blocked on backend, decided to not show fees for now so hard-codeed to always return false
  return false
}
