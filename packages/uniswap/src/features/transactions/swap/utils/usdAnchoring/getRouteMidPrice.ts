import type { Currency } from '@uniswap/sdk-core'
import { Fraction, Price } from '@uniswap/sdk-core'
import type { TradingApi } from '@universe/api'
import JSBI from 'jsbi'
import { logger } from 'utilities/src/logger/logger'

type PoolInRoute = TradingApi.V2PoolInRoute | TradingApi.V3PoolInRoute | TradingApi.V4PoolInRoute

/** The classic-quote route: an array of paths, each path an ordered array of pool hops. */
export type ClassicQuoteRoute = TradingApi.ClassicQuote['route']

const ZERO = JSBI.BigInt(0)
const ONE = JSBI.BigInt(1)
const Q192 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(192))

function parsePositiveBigint(value: string | undefined): JSBI | undefined {
  if (!value) {
    return undefined
  }
  try {
    const parsed = JSBI.BigInt(value)
    return JSBI.greaterThan(parsed, ZERO) ? parsed : undefined
  } catch {
    return undefined
  }
}

/**
 * Mid price of one hop as a raw-unit fraction: raw tokenOut units per raw tokenIn unit.
 * Raw fractions telescope across hops (intermediate token decimals cancel), so the
 * caller only applies decimal scaling at the route ends via `Price`'s scalar.
 */
function getPoolMidFraction(pool: PoolInRoute): Fraction | undefined {
  const tokenInAddress = pool.tokenIn?.address?.toLowerCase()
  const tokenOutAddress = pool.tokenOut?.address?.toLowerCase()
  if (!tokenInAddress || !tokenOutAddress) {
    return undefined
  }

  switch (pool.type) {
    case 'v2-pool': {
      const { reserve0, reserve1 } = pool as TradingApi.V2PoolInRoute
      const reserves = [reserve0, reserve1]
      const reserveIn = reserves.find((reserve) => reserve?.token?.address?.toLowerCase() === tokenInAddress)
      const reserveOut = reserves.find((reserve) => reserve?.token?.address?.toLowerCase() === tokenOutAddress)
      const reserveInQuotient = parsePositiveBigint(reserveIn?.quotient)
      const reserveOutQuotient = parsePositiveBigint(reserveOut?.quotient)
      if (!reserveInQuotient || !reserveOutQuotient) {
        return undefined
      }
      return new Fraction(reserveOutQuotient, reserveInQuotient)
    }
    case 'v3-pool':
    case 'v4-pool': {
      const { sqrtRatioX96 } = pool as TradingApi.V3PoolInRoute | TradingApi.V4PoolInRoute
      const sqrtRatio = parsePositiveBigint(sqrtRatioX96)
      if (!sqrtRatio) {
        return undefined
      }
      // sqrtRatioX96 encodes sqrt(rawToken1/rawToken0) << 96; token0 is the lower-sorted
      // address (native currency is the zero address in v4, which sorts first).
      const rawToken1PerToken0 = new Fraction(JSBI.multiply(sqrtRatio, sqrtRatio), Q192)
      const tokenInIsToken0 = tokenInAddress < tokenOutAddress
      return tokenInIsToken0 ? rawToken1PerToken0 : rawToken1PerToken0.invert()
    }
    default:
      return undefined
  }
}

function getPathMidFraction(path: PoolInRoute[]): Fraction | undefined {
  let result: Fraction | undefined
  for (const pool of path) {
    const hop = getPoolMidFraction(pool)
    if (!hop) {
      return undefined
    }
    result = result ? result.multiply(hop) : hop
  }
  return result
}

/**
 * Derives the route mid price of a classic quote from its route pools, as a
 * `Price` of `outputCurrency` per `inputCurrency`.
 *
 * Split routes are averaged weighted by each path's input amount; when any path
 * is missing its input amount, paths are weighted equally. Returns `undefined`
 * whenever the route is absent or any hop lacks the reserves / sqrt price needed
 * for the computation, letting callers fall through to the execution price.
 *
 * Never throws: the route JSON is loosely typed API data, so any unexpected shape
 * (non-numeric strings, non-array paths, malformed pools) is caught, logged, and
 * degrades to `undefined` so callers fall down the pricing ladder.
 */
export function getRouteMidPrice(args: {
  route: ClassicQuoteRoute | undefined
  inputCurrency: Currency
  outputCurrency: Currency
}): Price<Currency, Currency> | undefined {
  try {
    return computeRouteMidPrice(args)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'getRouteMidPrice', function: 'getRouteMidPrice' },
    })
    return undefined
  }
}

function computeRouteMidPrice({
  route,
  inputCurrency,
  outputCurrency,
}: {
  route: ClassicQuoteRoute | undefined
  inputCurrency: Currency
  outputCurrency: Currency
}): Price<Currency, Currency> | undefined {
  if (!route || route.length === 0) {
    return undefined
  }

  const pathFractions: Fraction[] = []
  for (const path of route) {
    const fraction = getPathMidFraction(path)
    if (!fraction) {
      return undefined
    }
    pathFractions.push(fraction)
  }

  const amountWeights = route.map((path) => parsePositiveBigint(path[0]?.amountIn))
  const allWeighted = amountWeights.every((weight): weight is JSBI => weight !== undefined)
  const weights = allWeighted ? amountWeights : route.map(() => ONE)

  let weightedSum = new Fraction(0)
  let totalWeight = new Fraction(0)
  for (const [index, fraction] of pathFractions.entries()) {
    const weight = weights[index] ?? ONE
    weightedSum = weightedSum.add(fraction.multiply(weight))
    totalWeight = totalWeight.add(new Fraction(weight))
  }

  const mid = weightedSum.divide(totalWeight)
  if (!JSBI.greaterThan(mid.numerator, ZERO) || !JSBI.greaterThan(mid.denominator, ZERO)) {
    return undefined
  }

  return new Price(inputCurrency, outputCurrency, mid.denominator, mid.numerator)
}
