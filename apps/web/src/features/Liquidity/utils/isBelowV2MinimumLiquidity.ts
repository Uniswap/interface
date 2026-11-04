import { Currency, CurrencyAmount, sqrt } from '@uniswap/sdk-core'
import { MINIMUM_LIQUIDITY } from '@uniswap/v2-sdk'
import JSBI from 'jsbi'

/**
 * Whether the first deposit into a v2 pair is too small to mint. `UniswapV2Pair.mint` locks
 * MINIMUM_LIQUIDITY on the first deposit as `sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY` (raw units),
 * which reverts with `ds-math-sub-underflow` below the minimum and `INSUFFICIENT_LIQUIDITY_MINTED` at it.
 * Only meaningful for a pair with no supply yet; later deposits mint pro rata and have no floor.
 */
export function isBelowV2MinimumLiquidity({
  amount0,
  amount1,
}: {
  amount0: Maybe<CurrencyAmount<Currency>>
  amount1: Maybe<CurrencyAmount<Currency>>
}): boolean {
  if (!amount0 || !amount1) {
    return false
  }
  return JSBI.lessThanOrEqual(sqrt(JSBI.multiply(amount0.quotient, amount1.quotient)), MINIMUM_LIQUIDITY)
}
