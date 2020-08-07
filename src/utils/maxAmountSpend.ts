import { TokenAmount, ETHER, JSBI } from '@uniswap/sdk'
import { MIN_ETH } from '../constants'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount?: TokenAmount): TokenAmount | undefined {
  if (!currencyAmount) return
  if (currencyAmount.token.equals(ETHER)) {
    if (JSBI.greaterThan(currencyAmount.raw, MIN_ETH)) {
      return new TokenAmount(ETHER, JSBI.subtract(currencyAmount.raw, MIN_ETH))
    } else {
      return new TokenAmount(ETHER, JSBI.BigInt(0))
    }
  }
  return currencyAmount
}
