import { CurrencyAmount, JSBI, Currency, ChainId } from '@multiswap/sdk'
import { MIN_ETH } from '../constants'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 * @param chainId currency chain Id
 */
export function maxAmountSpend(currencyAmount?: CurrencyAmount, chainId?: ChainId): CurrencyAmount | undefined {
  if (!currencyAmount || !chainId) return undefined
  if (Currency.isBaseCurrency(currencyAmount.currency)) {
    if (JSBI.greaterThan(currencyAmount.raw, MIN_ETH)) {
      return CurrencyAmount.baseForId(JSBI.subtract(currencyAmount.raw, MIN_ETH), chainId)
    } else {
      return CurrencyAmount.baseForId(JSBI.BigInt(0), chainId)
    }
  }
  return currencyAmount
}
