import { CurrencyAmount, sqrt, Token } from '@uniswap/sdk-core'
import { encodeSqrtRatioX96, FeeAmount, nearestUsableTick, Pool, TICK_SPACINGS, TickMath } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'

export function v2StylePool(
  reserve0: CurrencyAmount<Token>,
  reserve1: CurrencyAmount<Token>,
  feeAmount: FeeAmount = FeeAmount.MEDIUM
) {
  const sqrtRatioX96 = encodeSqrtRatioX96(reserve1.quotient, reserve0.quotient)
  const liquidity = sqrt(JSBI.multiply(reserve0.quotient, reserve1.quotient))
  return new Pool(
    reserve0.currency,
    reserve1.currency,
    feeAmount,
    sqrtRatioX96,
    liquidity,
    TickMath.getTickAtSqrtRatio(sqrtRatioX96),
    [
      {
        index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: liquidity,
        liquidityGross: liquidity,
      },
      {
        index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt(-1)),
        liquidityGross: liquidity,
      },
    ]
  )
}
