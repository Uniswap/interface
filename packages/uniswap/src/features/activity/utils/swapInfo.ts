import { SwapTypeTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { getAmountsFromTrade } from 'uniswap/src/features/transactions/swap/utils/getAmountsFromTrade'
import { BridgeTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { NumberType } from 'utilities/src/format/types'

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
