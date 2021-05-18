import {
  priceToClosestTick,
  nearestUsableTick,
  FeeAmount,
  TICK_SPACINGS,
  encodeSqrtRatioX96,
  TickMath,
} from '@uniswap/v3-sdk/dist/'
import { Price, Token } from '@uniswap/sdk-core'
import { tryParseAmount } from 'state/swap/hooks'
import JSBI from 'jsbi'

export function tryParseTick(
  baseToken?: Token,
  quoteToken?: Token,
  feeAmount?: FeeAmount,
  value?: string
): number | undefined {
  if (!baseToken || !quoteToken || !feeAmount || !value) {
    return undefined
  }

  // base token fixed at 1 unit, quote token amount based on typed input
  const amount = tryParseAmount(value, quoteToken)
  const amountOne = tryParseAmount('1', baseToken)

  if (!amount || !amountOne) return undefined

  // parse the typed value into a price
  const price = new Price(baseToken, quoteToken, amountOne.quotient, amount.quotient)

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
