import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { getDefaultRangeTicks } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/defaultPriceRange'
import { calculateStrategyTicks } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceStrategies'
import { getPoolHistoryQueryVars } from '~/features/Liquidity/charts/liquidityServiceHistoryVars'
import { useLiquidityServicePoolPriceChartData } from '~/features/Liquidity/charts/useLiquidityServicePoolPriceChartData'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import type { TickRange } from '~/features/Liquidity/Create/types'
import { getBaseAndQuoteCurrencies } from '~/features/Liquidity/utils/currency'
import { toDisplayTick } from '~/features/Liquidity/utils/displayTicks'

/**
 * The range the range chart would open on, in display ticks: the middle of the month's price history, or
 * the stable preset when there isn't enough history to define one. Undefined until the pool and its
 * history have loaded, and for v2.
 */
export function useDefaultPriceRange(): TickRange | undefined {
  const { protocolVersion, poolOrPair, price, currencies, priceRangeState, poolId } = useCreateLiquidityContext()
  const { priceInverted } = priceRangeState
  const pool = poolOrPair && 'tickCurrent' in poolOrPair ? poolOrPair : undefined
  const currentPrice = price ? Number(price.toSignificant()) : undefined
  // The month the range chart opens on, ending at the live price.
  const { entries, loading } = useLiquidityServicePoolPriceChartData({
    variables: getPoolHistoryQueryVars({
      addressOrId: poolId,
      chainId: currencies.sdk.TOKEN0?.chainId as UniverseChainId | undefined,
      protocolVersion,
      duration: HistoryDuration.Month,
    }),
    priceInverted,
    currentPrice,
    disabled: protocolVersion === ProtocolVersion.V2,
  })

  return useMemo(() => {
    if (protocolVersion === ProtocolVersion.V2 || !pool || loading || !currentPrice) {
      return undefined
    }
    const currentTick = toDisplayTick(pool.tickCurrent, priceInverted)
    const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.sdk, priceInverted)
    const { defaultMinTick, defaultMaxTick } = getDefaultRangeTicks({
      priceData: entries,
      tickSpacing: pool.tickSpacing,
      baseCurrency,
      quoteCurrency,
    })

    const hasDefault = defaultMinTick !== undefined && defaultMaxTick !== undefined && defaultMinTick !== defaultMaxTick
    return hasDefault
      ? { minTick: Math.min(defaultMinTick, defaultMaxTick), maxTick: Math.max(defaultMinTick, defaultMaxTick) }
      : calculateStrategyTicks({
          priceStrategy: DefaultPriceStrategy.STABLE,
          currentTick,
          tickSpacing: pool.tickSpacing,
        })
  }, [protocolVersion, pool, loading, currentPrice, entries, priceInverted, currencies.sdk])
}
