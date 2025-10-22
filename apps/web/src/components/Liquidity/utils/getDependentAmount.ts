import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { PositionField } from 'types/position'

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
  const [token0Wrapped, token1Wrapped] = [token0?.wrapped, token1?.wrapped]
  if (!token0Wrapped || !token1Wrapped || !independentAmount || !pair) {
    return undefined
  }

  try {
    const dependentTokenAmount =
      exactField === PositionField.TOKEN0
        ? pair.priceOf(token0Wrapped).quote(independentAmount.wrapped)
        : pair.priceOf(token1Wrapped).quote(independentAmount.wrapped)

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
}): CurrencyAmount<Currency> {
  const wrappedIndependentAmount = independentAmount.wrapped
  const independentTokenIsFirstToken = wrappedIndependentAmount.currency.equals(pool.token0)

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
}): CurrencyAmount<Currency> {
  const independentTokenIsFirstToken = independentAmount.currency.equals(pool.token0)

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
}
