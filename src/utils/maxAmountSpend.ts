import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { NETWORKS_INFO } from 'constants/networks'

const ZERO = JSBI.BigInt(0)

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  if (!currencyAmount) return undefined
  if (currencyAmount.currency.isNative) {
    const minForGas = JSBI.BigInt(NETWORKS_INFO[currencyAmount.currency.chainId].nativeToken.minForGas)
    const subtractedGas = JSBI.subtract(currencyAmount.quotient, minForGas)
    const maxSpend = JSBI.greaterThan(subtractedGas, ZERO) ? subtractedGas : ZERO

    return CurrencyAmount.fromRawAmount(currencyAmount.currency, maxSpend)
  }

  return currencyAmount
}

export function halfAmountSpend(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  if (!currencyAmount) return undefined
  let halfSpend = JSBI.divide(currencyAmount.quotient, JSBI.BigInt(2))

  if (currencyAmount.currency.isNative) {
    const minForGas = JSBI.BigInt(NETWORKS_INFO[currencyAmount.currency.chainId].nativeToken.minForGas)
    const subtractedGas = JSBI.subtract(currencyAmount.quotient, minForGas)
    const halfAmount = JSBI.lessThan(halfSpend, subtractedGas) ? halfSpend : subtractedGas
    halfSpend = JSBI.greaterThan(halfAmount, ZERO) ? halfAmount : ZERO
  }

  return CurrencyAmount.fromRawAmount(currencyAmount.currency, halfSpend)
}
