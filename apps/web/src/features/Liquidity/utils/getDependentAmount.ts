import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { TickMath, Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import JSBI from 'jsbi'
import { getWrappedAmountIfExists, getWrappedTokenIfExists } from 'uniswap/src/utils/currency'
import { logger } from 'utilities/src/logger/logger'
import { PositionField } from '~/types/position'

export function getDependentAmountFromV2Pair({
  independentAmount,
  otherAmount,
  pair,
  exactField,
  token0,
  token1,
  dependentToken,
}: {
  independentAmount?: CurrencyAmount<Currency>
  otherAmount?: CurrencyAmount<Currency>
  pair?: Pair
  exactField: PositionField
  token0: Maybe<Currency>
  token1: Maybe<Currency>
  dependentToken: Maybe<Currency>
}): CurrencyAmount<Currency> | undefined {
  const [token0Wrapped, token1Wrapped] = [getWrappedTokenIfExists(token0), getWrappedTokenIfExists(token1)]
  const wrappedIndependentAmount = getWrappedAmountIfExists(independentAmount)
  if (!token0Wrapped || !token1Wrapped || !wrappedIndependentAmount || !pair) {
    return undefined
  }

  try {
    const dependentTokenAmount =
      exactField === PositionField.TOKEN0
        ? pair.priceOf(token0Wrapped).quote(wrappedIndependentAmount)
        : pair.priceOf(token1Wrapped).quote(wrappedIndependentAmount)

    return dependentToken
      ? dependentToken.isNative
        ? CurrencyAmount.fromRawAmount(dependentToken, dependentTokenAmount.quotient)
        : dependentTokenAmount
      : undefined
  } catch {
    // in some cases there can be an initialized pool but there is no liquidity in which case
    // the user can enter whatever they want for the dependent amount and that pool will be created
    return otherAmount
  }
}

// No real deposit exceeds uint128 (v4 settles liquidity deltas as int128, v3 owes tokens as uint128).
// Anything larger is the SDK's MaxUint256 placeholder leaking out of a range that can't take the
// independent token — e.g. a backend quote priced a tick ahead of our polled pool.
const MAX_DEPOSIT_AMOUNT = (1n << 128n) - 1n

export function isImpossibleDependentAmount(rawAmount: string | undefined): boolean {
  if (rawAmount === undefined) {
    return false
  }
  try {
    return BigInt(rawAmount) > MAX_DEPOSIT_AMOUNT
  } catch {
    return true
  }
}

/**
 * True when the price is at or past the range edge on the token's side (the upper edge for token0, the
 * lower for token1), so the range holds none of that token. Uses the sqrt price, not the tick: a swap
 * that lands exactly on a tick going down leaves the tick one below that sqrt price's own tick. Past this
 * point `fromAmount0`/`fromAmount1` size the position off their `MaxUint256` placeholder for the other
 * side and return ~MaxUint256 as the dependent amount.
 */
export function isTokenSideExhausted({
  pool,
  edgeTick,
  isToken0,
}: {
  pool: V3Pool | V4Pool
  edgeTick: number
  isToken0: boolean
}): boolean {
  if (edgeTick < TickMath.MIN_TICK || edgeTick > TickMath.MAX_TICK) {
    return false
  }
  return isToken0
    ? JSBI.greaterThanOrEqual(pool.sqrtRatioX96, TickMath.getSqrtRatioAtTick(edgeTick))
    : JSBI.lessThanOrEqual(pool.sqrtRatioX96, TickMath.getSqrtRatioAtTick(edgeTick))
}

export function getDependentAmountFromV3Position({
  independentAmount,
  pool,
  tickLower,
  tickUpper,
}: {
  independentAmount: CurrencyAmount<Currency>
  pool: V3Pool
  tickLower: number
  tickUpper: number
}): CurrencyAmount<Currency> | undefined {
  // Position math divides by (sqrtRatioB - sqrtRatioA); equal ticks (min price == max price)
  // crash with a division-by-zero RangeError and inverted ticks fail a TICK_ORDER invariant.
  // Both are reachable from user input, so degrade to undefined instead of throwing in render.
  if (tickLower >= tickUpper) {
    return undefined
  }

  const wrappedIndependentAmount = getWrappedAmountIfExists(independentAmount)
  if (!wrappedIndependentAmount) {
    return undefined
  }

  const independentTokenIsFirstToken = wrappedIndependentAmount.currency.equals(pool.token0)

  try {
    if (
      isTokenSideExhausted({
        pool,
        edgeTick: independentTokenIsFirstToken ? tickUpper : tickLower,
        isToken0: independentTokenIsFirstToken,
      })
    ) {
      return CurrencyAmount.fromRawAmount(independentTokenIsFirstToken ? pool.token1 : pool.token0, 0)
    }

    if (independentTokenIsFirstToken) {
      return V3Position.fromAmount0({
        pool,
        tickLower,
        tickUpper,
        amount0: wrappedIndependentAmount.quotient,
        useFullPrecision: true,
      }).amount1
    }

    return V3Position.fromAmount1({
      pool,
      tickLower,
      tickUpper,
      amount1: wrappedIndependentAmount.quotient,
    }).amount0
  } catch (error) {
    logger.warn('getDependentAmount', 'getDependentAmountFromV3Position', 'position math failed', {
      error,
      tickLower,
      tickUpper,
    })
    return undefined
  }
}

export function getDependentAmountFromV4Position({
  independentAmount,
  pool,
  tickLower,
  tickUpper,
}: {
  independentAmount: CurrencyAmount<Currency>
  pool: V4Pool
  tickLower: number
  tickUpper: number
}): CurrencyAmount<Currency> | undefined {
  if (tickLower >= tickUpper) {
    return undefined
  }

  const independentTokenIsFirstToken = independentAmount.currency.equals(pool.token0)

  try {
    if (
      isTokenSideExhausted({
        pool,
        edgeTick: independentTokenIsFirstToken ? tickUpper : tickLower,
        isToken0: independentTokenIsFirstToken,
      })
    ) {
      return CurrencyAmount.fromRawAmount(independentTokenIsFirstToken ? pool.token1 : pool.token0, 0)
    }

    if (independentTokenIsFirstToken) {
      return V4Position.fromAmount0({
        pool,
        tickLower,
        tickUpper,
        amount0: independentAmount.quotient,
        useFullPrecision: true,
      }).amount1
    }

    return V4Position.fromAmount1({
      pool,
      tickLower,
      tickUpper,
      amount1: independentAmount.quotient,
    }).amount0
  } catch (error) {
    logger.warn('getDependentAmount', 'getDependentAmountFromV4Position', 'position math failed', {
      error,
      tickLower,
      tickUpper,
    })
    return undefined
  }
}
