import { JSBI, TokenAmount, WETH } from '@uniswap/sdk'
import { MIN_ETH } from '../constants'

/**
 * Given some token amount, return the max that can be spent of it
 * @param tokenAmount to return max of
 */
export function maxAmountSpend(tokenAmount?: TokenAmount): TokenAmount | undefined {
  if (!tokenAmount) return
  if (tokenAmount.token.equals(WETH[tokenAmount.token.chainId])) {
    if (JSBI.greaterThan(tokenAmount.raw, MIN_ETH)) {
      return new TokenAmount(tokenAmount.token, JSBI.subtract(tokenAmount.raw, MIN_ETH))
    } else {
      return new TokenAmount(tokenAmount.token, JSBI.BigInt(0))
    }
  }
  return tokenAmount
}
