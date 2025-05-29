import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'

type TradeAmounts = {
  inputCurrencyAmount: Maybe<CurrencyAmount<Currency>>
  outputCurrencyAmount: Maybe<CurrencyAmount<Currency>>
}

export function getTradeAmounts(
  acceptedDerivedSwapInfo?: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>,
  priceUXEnabled = false,
): TradeAmounts {
  if (!acceptedDerivedSwapInfo) {
    return { inputCurrencyAmount: undefined, outputCurrencyAmount: undefined }
  }

  const {
    trade: { trade, indicativeTrade },
    wrapType,
    currencyAmounts,
  } = acceptedDerivedSwapInfo
  const displayTrade = trade ?? indicativeTrade

  const isWrap = wrapType !== WrapType.NotApplicable

  // For wraps, we need to detect if WETH is input or output, because we have logic in `useDerivedSwapInfo` that
  // sets both currencyAmounts to native currency, which would result in native ETH as both tokens for this UI.
  const wrapInputCurrencyAmount =
    wrapType === WrapType.Wrap ? currencyAmounts[CurrencyField.INPUT] : currencyAmounts[CurrencyField.INPUT]?.wrapped
  const wrapOutputCurrencyAmount =
    wrapType === WrapType.Wrap ? currencyAmounts[CurrencyField.OUTPUT]?.wrapped : currencyAmounts[CurrencyField.OUTPUT]

  // Token amounts
  // On review screen, always show values directly from trade object, to match exactly what is submitted on chain
  // For wraps, we have no trade object so use values from form state
  const inputCurrencyAmount = isWrap ? wrapInputCurrencyAmount : displayTrade?.inputAmount
  const outputCurrencyAmount = isWrap
    ? wrapOutputCurrencyAmount
    : priceUXEnabled
      ? displayTrade?.quoteOutputAmount
      : displayTrade?.outputAmount

  return {
    inputCurrencyAmount,
    outputCurrencyAmount,
  }
}
