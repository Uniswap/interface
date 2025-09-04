import { Currency, Price, Token } from '@uniswap/sdk-core'
import {
  encodeSqrtRatioX96,
  FeeAmount,
  nearestUsableTick,
  priceToClosestTick,
  TICK_SPACINGS,
  TickMath,
} from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { convertScientificNotationToNumber } from 'utilities/src/format/convertScientificNotation'

export function tryParsePrice<T extends Currency>({
  baseToken,
  quoteToken,
  value,
}: {
  baseToken?: T
  quoteToken?: T
  value?: string
}): Price<T, T> | undefined {
  if (!baseToken || !quoteToken || !value) {
    return undefined
  }

  // Convert scientific notation to decimal format
  const decimalValue = convertScientificNotationToNumber(value)

  if (!decimalValue.match(/^\d*\.?\d*$/)) {
    return undefined
  }

  const [whole, fraction] = decimalValue.split('.')

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const decimals = fraction?.length ?? 0
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const withoutDecimals = JSBI.BigInt((whole ?? '') + (fraction ?? ''))

  return new Price(
    baseToken,
    quoteToken,
    JSBI.multiply(JSBI.BigInt(10 ** decimals), JSBI.BigInt(10 ** baseToken.decimals)),
    JSBI.multiply(withoutDecimals, JSBI.BigInt(10 ** quoteToken.decimals)),
  )
}

export function tryParseTick({
  baseToken,
  quoteToken,
  feeAmount,
  value,
}: {
  baseToken?: Maybe<Token>
  quoteToken?: Maybe<Token>
  feeAmount?: FeeAmount
  value?: string
}): number | undefined {
  if (!baseToken || !quoteToken || !feeAmount || !value) {
    return undefined
  }

  const price = tryParsePrice({ baseToken, quoteToken, value })

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
