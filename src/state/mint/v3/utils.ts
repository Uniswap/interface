import {
  priceToClosestTick,
  nearestUsableTick,
  FeeAmount,
  TICK_SPACINGS,
  encodeSqrtRatioX96,
  TickMath,
} from '@uniswap/v3-sdk/dist/'
import { Price, Token } from '@uniswap/sdk-core'
import JSBI from 'jsbi'

export function tryParseAmountToPrice(baseToken?: Token, quoteToken?: Token, value?: string) {
  if (!baseToken || !quoteToken || !value) {
    return undefined
  }
  const numDecimals = value.indexOf('.') > -1 ? value.length - value.indexOf('.') - 1 : 0

  // base token fixed at 1 unit, quote token amount based on typed input
  return new Price(
    baseToken,
    quoteToken,
    10 ** numDecimals * 10 ** baseToken.decimals,
    parseFloat(value) * 10 ** numDecimals * 10 ** quoteToken.decimals
  )
}

export function tryParseTick(
  baseToken?: Token,
  quoteToken?: Token,
  feeAmount?: FeeAmount,
  value?: string
): number | undefined {
  if (!baseToken || !quoteToken || !feeAmount || !value) {
    return undefined
  }

  const price = tryParseAmountToPrice(baseToken, quoteToken, value)

  if (!price) {
    return undefined
  }

  let tick: number

  // check price is within min/max bounds, if outside return min/max
  const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator)

  if (JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)) {
    tick = TickMath.MAX_TICK
  } else if (JSBI.lessThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO)) {
    tick = TickMath.MIN_TICK
  } else {
    // this function is agnostic to the base, will always return the correct tick
    tick = priceToClosestTick(price)
  }

  return nearestUsableTick(tick, TICK_SPACINGS[feeAmount])
}
