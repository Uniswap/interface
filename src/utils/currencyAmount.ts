import { Currency, CurrencyAmount, Fraction, Percent, TokenAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { basisPointsToPercent } from 'utils'

export const minimumAmountAfterSlippage = (amount: CurrencyAmount<Currency>, slippage: number | Percent) => {
  const slippagePercent = typeof slippage === 'number' ? basisPointsToPercent(slippage) : slippage

  const slippageAdjustedAmount = new Fraction(JSBI.BigInt(1))
    .add(slippagePercent)
    .invert()
    .multiply(amount.quotient).quotient
  return TokenAmount.fromRawAmount(amount.currency, slippageAdjustedAmount)
}

export const maximumAmountAfterSlippage = (amount: CurrencyAmount<Currency>, slippage: Percent) => {
  const slippagePercent = typeof slippage === 'number' ? basisPointsToPercent(slippage) : slippage

  const slippageAdjustedAmount = new Fraction(JSBI.BigInt(1)).add(slippagePercent).multiply(amount.quotient).quotient
  return TokenAmount.fromRawAmount(amount.currency, slippageAdjustedAmount)
}

export const toCurrencyAmount = function (currency: Currency, value: string | number): CurrencyAmount<Currency> {
  try {
    return TokenAmount.fromRawAmount(currency, JSBI.BigInt(value))
  } catch (e) {
    return TokenAmount.fromRawAmount(currency, 0)
  }
}
