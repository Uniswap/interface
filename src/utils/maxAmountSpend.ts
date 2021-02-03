import { TokenAmount } from '@ubeswap/sdk'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount?: TokenAmount): TokenAmount | undefined {
  return currencyAmount
}
