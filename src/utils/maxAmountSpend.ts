import { CurrencyAmount, ETHER, JSBI } from '@swapr/sdk'
import { MIN_ETH } from '../constants'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount?: CurrencyAmount, chainId?: number): CurrencyAmount | undefined {
  if (!currencyAmount || !chainId) return undefined
  if (currencyAmount.currency === ETHER) {
    if (JSBI.greaterThan(currencyAmount.raw, MIN_ETH)) {
      return CurrencyAmount.nativeCurrency(JSBI.subtract(currencyAmount.raw, MIN_ETH), chainId)
    } else {
      return CurrencyAmount.nativeCurrency(JSBI.BigInt(0), chainId)
    }
  }
  return currencyAmount
}
