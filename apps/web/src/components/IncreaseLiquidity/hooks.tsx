// eslint-disable-next-line no-restricted-imports
import { PoolPosition } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import { IncreaseLiquidityInfo, IncreaseLiquidityState } from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { parseV3FeeTier } from 'components/Liquidity/utils'
import { useAccount } from 'hooks/useAccount'
import { usePool } from 'hooks/usePools'
import { useV2Pair } from 'hooks/useV2Pairs'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'
import { PositionField } from 'types/position'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'

export function useDerivedIncreaseLiquidityInfo(state: IncreaseLiquidityState): IncreaseLiquidityInfo {
  const account = useAccount()
  const { position: positionInfo, exactAmount, exactField } = state

  if (!positionInfo) {
    throw new Error('no position available')
  }

  const token0 = positionInfo.currency0Amount.currency
  const token1 = positionInfo.currency1Amount.currency

  const [token0Balance, token1Balance] = useCurrencyBalances(account.address, [token0, token1])

  const [independentToken, dependentToken] = exactField === PositionField.TOKEN0 ? [token0, token1] : [token1, token0]
  const independentAmount = tryParseCurrencyAmount(exactAmount, independentToken)

  const [, pool] = usePool(token0, token1, parseV3FeeTier(positionInfo.feeTier))
  const [, pair] = useV2Pair(token0, token1)

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    // we wrap the currencies just to get the price in terms of the other token
    const wrappedIndependentAmount = independentAmount?.wrapped

    if (positionInfo.restPosition.position.case === 'v2Pair') {
      const [token0Wrapped, token1Wrapped] = [token0?.wrapped, token1?.wrapped]

      if (token0Wrapped && token1Wrapped && wrappedIndependentAmount && pair) {
        const dependentTokenAmount =
          exactField === PositionField.TOKEN0
            ? pair.priceOf(token0Wrapped).quote(wrappedIndependentAmount)
            : pair.priceOf(token1Wrapped).quote(wrappedIndependentAmount)
        return dependentToken?.isNative
          ? CurrencyAmount.fromRawAmount(dependentToken, dependentTokenAmount.quotient)
          : dependentTokenAmount
      }
      return undefined
    }

    if (positionInfo.restPosition.position.case === 'v3Position') {
      const position: PoolPosition = positionInfo.restPosition.position.value
      const { tickLower: tickLowerStr, tickUpper: tickUpperStr } = position
      const tickLower = parseInt(tickLowerStr)
      const tickUpper = parseInt(tickUpperStr)

      if (
        independentAmount &&
        wrappedIndependentAmount &&
        typeof tickLower === 'number' &&
        typeof tickUpper === 'number' &&
        pool
      ) {
        const position: Position | undefined = wrappedIndependentAmount.currency.equals(pool.token0)
          ? Position.fromAmount0({
              pool,
              tickLower,
              tickUpper,
              amount0: independentAmount.quotient,
              useFullPrecision: true, // we want full precision for the theoretical position
            })
          : Position.fromAmount1({
              pool,
              tickLower,
              tickUpper,
              amount1: independentAmount.quotient,
            })

        const dependentTokenAmount = wrappedIndependentAmount.currency.equals(pool.token0)
          ? position.amount1
          : position.amount0
        return dependentToken && CurrencyAmount.fromRawAmount(dependentToken, dependentTokenAmount.quotient)
      }

      return undefined
    }

    if (positionInfo.restPosition.position.case === 'v4Position') {
      // TODO: calculate for v4
      return undefined
    }

    return undefined
  }, [
    dependentToken,
    independentAmount,
    pool,
    positionInfo.restPosition.position,
    exactField,
    pair,
    token0.wrapped,
    token1.wrapped,
  ])

  const independentTokenUSDValue = useUSDCValue(independentAmount) || undefined
  const dependentTokenUSDValue = useUSDCValue(dependentAmount) || undefined

  const dependentField = exactField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
  return {
    currencyBalances: { [PositionField.TOKEN0]: token0Balance, [PositionField.TOKEN1]: token1Balance },
    formattedAmounts: { [exactField]: exactAmount, [dependentField]: dependentAmount?.toExact() },
    currencyAmounts: { [exactField]: independentAmount, [dependentField]: dependentAmount },
    currencyAmountsUSDValue: { [exactField]: independentTokenUSDValue, [dependentField]: dependentTokenUSDValue },
  }
}
