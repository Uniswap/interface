import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { calculateAnchoredLiquidityByTick } from 'components/Charts/LiquidityChart/utils/calculateAnchoredLiquidityByTick'
import { calculateTokensLocked } from 'components/Charts/LiquidityChart/utils/calculateTokensLocked'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { usePoolActiveLiquidity } from 'hooks/usePoolTickData'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { PositionField } from 'types/position'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { TickProcessed } from 'utils/computeSurroundingTicks'

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
}) {
  const { isLoading, error, data, activeTick, liquidity } = usePoolActiveLiquidity({
    sdkCurrencies,
    version,
    poolId,
    feeAmount,
    chainId,
    tickSpacing,
    hooks,
    skip,
  })

  const fetcher = async () => {
    if (!sdkCurrencies.TOKEN0 || !sdkCurrencies.TOKEN1 || feeAmount === undefined || !tickSpacing) {
      return null
    }

    if (!data || !activeTick || !liquidity) {
      return null
    }

    const newData: ChartEntry[] = []

    // Calculate anchored active liquidity per tick using three-step anchoring process
    const activeLiquidityByTick = calculateAnchoredLiquidityByTick({ ticksProcessed: data, activeTick, liquidity })

    for (let i = 0; i < data.length; i++) {
      const t: TickProcessed = data[i]

      const price0 = priceInverted ? t.sdkPrice.invert().toSignificant(8) : t.sdkPrice.toSignificant(8)

      const { amount0Locked, amount1Locked } = calculateTokensLocked({
        token0: sdkCurrencies.TOKEN0,
        token1: sdkCurrencies.TOKEN1,
        tickSpacing,
        currentTick: activeTick,
        amount: activeLiquidityByTick.get(t.tick) ?? JSBI.BigInt(0),
        tick: t,
      })

      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        liquidityNet: parseFloat(t.liquidityNet.toString()),
        price0: parseFloat(price0),
        tick: t.tick,
        amount0Locked: priceInverted ? amount0Locked : amount1Locked,
        amount1Locked: priceInverted ? amount1Locked : amount0Locked,
      }

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry)
      }
    }

    return newData
  }

  const { data: formattedData } = useQuery({
    queryKey: [
      ReactQueryCacheKey.DensityChartData,
      poolId,
      sdkCurrencies.TOKEN0,
      sdkCurrencies.TOKEN1,
      feeAmount,
      priceInverted,
      version,
      chainId,
      tickSpacing,
      data,
    ],
    queryFn: fetcher,
  })

  return useMemo(() => {
    return {
      isLoading: isLoading || (Boolean(data) && !formattedData),
      error,
      formattedData: isLoading || !formattedData ? undefined : formattedData,
    }
  }, [data, error, formattedData, isLoading])
}
