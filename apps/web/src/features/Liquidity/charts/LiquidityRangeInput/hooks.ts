import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { calculateTokensLocked } from '~/features/Liquidity/charts/LiquidityChart/utils/calculateTokensLocked'
import { getTickDataFingerprint } from '~/features/Liquidity/charts/LiquidityRangeInput/tickDataFingerprint'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { usePoolActiveLiquidity } from '~/features/Liquidity/hooks/usePoolTickData'
import { TickProcessed } from '~/features/Liquidity/utils/computeSurroundingTicks'
import { V2Reserves } from '~/features/Liquidity/utils/v2SyntheticTicks'
import { PositionField } from '~/types/position'

/**
 * Currency A and B should be sorted to get accurate data, but you can pass invertPrices = true
 * to get inverted prices.
 */
export function useDensityChartData({
  poolId,
  sdkCurrencies,
  feeAmount,
  priceInverted,
  version,
  chainId,
  tickSpacing,
  hooks,
  skip,
  v2Reserves,
}: {
  poolId?: string
  sdkCurrencies: { [field in PositionField]: Maybe<Currency> }
  feeAmount?: number
  priceInverted?: boolean
  version: ProtocolVersion
  chainId?: UniverseChainId
  tickSpacing?: number
  hooks?: string
  skip?: boolean
  v2Reserves?: V2Reserves
}) {
  const { isLoading, error, data, activeTick, liquidity, sqrtPriceX96 } = usePoolActiveLiquidity({
    sdkCurrencies,
    version,
    poolId,
    feeAmount,
    chainId,
    tickSpacing,
    hooks,
    skip,
    v2Reserves,
  })

  const fetcher = async () => {
    if (!sdkCurrencies.TOKEN0 || !sdkCurrencies.TOKEN1 || feeAmount === undefined || !tickSpacing) {
      return null
    }

    if (!data || activeTick === undefined || !liquidity) {
      return null
    }

    const newData: ChartEntry[] = []

    for (let i = 0; i < data.length; i++) {
      const t: TickProcessed = data[i]

      const price0 = priceInverted ? t.sdkPrice.invert().toSignificant(8) : t.sdkPrice.toSignificant(8)

      const { amount0Locked, amount1Locked } = calculateTokensLocked({
        token0: sdkCurrencies.TOKEN0,
        token1: sdkCurrencies.TOKEN1,
        tickSpacing,
        currentTick: activeTick,
        nextTick: data[i + 1]?.tick,
        amount: JSBI.BigInt(t.liquidityActive.toString()),
        tick: t,
        sqrtPriceX96,
      })

      const chartEntry = {
        liquidityActive: parseFloat(t.liquidityActive.toString()),
        liquidityNet: parseFloat(t.liquidityNet.toString()),
        price0: parseFloat(price0),
        tick: t.tick,
        amount0Locked: priceInverted ? amount0Locked : amount1Locked,
        amount1Locked: priceInverted ? amount1Locked : amount0Locked,
      }

      newData.push(chartEntry)
    }

    return newData
  }

  // react-query hashes the key on every render, and the processed ticks are thousands of entries of
  // JSBIs and SDK Prices, so keying on them directly cost ~0.5s per interaction on a deep pool. The key
  // carries a fingerprint computed once per tick set instead, plus the pool state the formatter reads.
  const dataFingerprint = useMemo(() => (data ? getTickDataFingerprint(data) : undefined), [data])

  const { data: formattedData } = useQuery(
    persistableQueryOptions({
      queryKey: [
        ReactQueryCacheKey.DensityChartData,
        poolId,
        sdkCurrencies.TOKEN0 ? currencyId(sdkCurrencies.TOKEN0) : undefined,
        sdkCurrencies.TOKEN1 ? currencyId(sdkCurrencies.TOKEN1) : undefined,
        feeAmount,
        priceInverted,
        version,
        chainId,
        tickSpacing,
        activeTick,
        liquidity?.toString(),
        sqrtPriceX96?.toString(),
        dataFingerprint,
      ],
      queryFn: fetcher,
    }),
  )

  return useMemo(() => {
    return {
      isLoading: isLoading || (Boolean(data) && !formattedData),
      error,
      formattedData: isLoading || !formattedData ? undefined : formattedData,
    }
  }, [data, error, formattedData, isLoading])
}
