import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { SwapFee } from 'uniswap/src/features/transactions/swap/types/trade'

export function getSwapFeeUsd({
  swapFee,
  amount,
  amountUsd,
}: {
  swapFee: SwapFee
  amount: CurrencyAmount<Currency>
  amountUsd: CurrencyAmount<Currency>
}): number | undefined {
  const outputCurrencyPricePerUnitExact = (parseFloat(amountUsd.toExact()) / parseFloat(amount.toExact())).toString()

  const currencyAmount = getCurrencyAmount({
    value: swapFee.amount,
    valueType: ValueType.Raw,
    currency: amount.currency,
  })

  if (!currencyAmount) {
    return undefined
  }

  const feeUsd = parseFloat(outputCurrencyPricePerUnitExact) * parseFloat(currencyAmount.toExact())
  return feeUsd
}

export function getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo: DerivedSwapInfo): number | undefined {
  const swapFee = derivedSwapInfo.trade.trade?.swapFee

  if (!swapFee) {
    return undefined
  }

  const amount = derivedSwapInfo.currencyAmounts[swapFee.feeField]
  const amountUsd = derivedSwapInfo.currencyAmountsUSDValue[swapFee.feeField]

  if (!amount || !amountUsd) {
    return undefined
  }

  return getSwapFeeUsd({ swapFee, amount, amountUsd })
}
