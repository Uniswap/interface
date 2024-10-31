import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { CurrencyField } from 'uniswap/src/types/currency'

export function getSwapFeeUsd({
  trade,
  outputAmount,
  outputAmountUsd,
}: {
  trade: Trade
  outputAmount: CurrencyAmount<Currency>
  outputAmountUsd: CurrencyAmount<Currency>
}): number | undefined {
  if (!trade.swapFee) {
    return undefined
  }

  const outputCurrencyPricePerUnitExact = (
    parseFloat(outputAmountUsd.toExact()) / parseFloat(outputAmount.toExact())
  ).toString()

  const currencyAmount = getCurrencyAmount({
    value: trade.swapFee.amount,
    valueType: ValueType.Raw,
    currency: trade.outputAmount.currency,
  })

  if (!currencyAmount) {
    return undefined
  }

  const feeUsd = parseFloat(outputCurrencyPricePerUnitExact) * parseFloat(currencyAmount.toExact())
  return feeUsd
}

export function getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo: DerivedSwapInfo): number | undefined {
  if (
    !derivedSwapInfo.trade.trade ||
    !derivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT] ||
    !derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]
  ) {
    return undefined
  }

  return getSwapFeeUsd({
    trade: derivedSwapInfo.trade.trade,
    outputAmount: derivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT],
    outputAmountUsd: derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT],
  })
}
