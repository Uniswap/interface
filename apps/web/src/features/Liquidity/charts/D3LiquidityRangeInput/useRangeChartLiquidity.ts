import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import {
  toVisualLiquidityEntries,
  toVisualTicks,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/visualTickData'
import { useDensityChartData } from '~/features/Liquidity/charts/LiquidityRangeInput/hooks'
import type { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { useAllPoolTicks } from '~/features/Liquidity/hooks/usePoolTickData'
import type { TickData } from '~/features/Liquidity/types/ticks'
import { useColor } from '~/hooks/useColor'
import type { PositionField } from '~/types/position'

/**
 * A pool's ticks and liquidity for the range chart, in its visual space: ticks ascend with the price as shown,
 * negated when the price is inverted. `rawTicks` / `liquidityData` stay undefined until they load, and
 * `liquidityData` also until the current tick is known.
 */
export function useRangeChartLiquidity({
  poolId,
  sdkCurrencies,
  feeAmount,
  chainId,
  version,
  tickSpacing,
  hook,
  priceInverted,
  currentTick,
  skip,
}: {
  poolId?: string
  sdkCurrencies: { [field in PositionField]: Maybe<Currency> }
  feeAmount?: number
  chainId: UniverseChainId
  version: ProtocolVersion
  tickSpacing?: number
  hook?: string
  priceInverted: boolean
  currentTick?: number
  skip?: boolean
}): {
  rawTicks?: TickData[]
  liquidityData?: ChartEntry[]
  rawTicksLoading: boolean
  liquidityDataLoading: boolean
  error: unknown
} {
  const hooks = hook ?? ZERO_ADDRESS
  const {
    formattedData,
    isLoading: liquidityDataLoading,
    error: densityError,
  } = useDensityChartData({
    poolId,
    sdkCurrencies,
    priceInverted,
    version,
    feeAmount,
    chainId,
    tickSpacing,
    hooks,
    skip,
  })
  const {
    ticks,
    isLoading: rawTicksLoading,
    error: ticksError,
  } = useAllPoolTicks({
    sdkCurrencies,
    feeAmount,
    chainId,
    version,
    tickSpacing,
    hooks,
    precalculatedPoolId: poolId,
    skip,
  })

  const rawTicks = useMemo(() => ticks && toVisualTicks(ticks, priceInverted), [ticks, priceInverted])
  const liquidityData = useMemo(
    () =>
      formattedData && currentTick !== undefined && tickSpacing !== undefined
        ? toVisualLiquidityEntries({ entries: formattedData, currentTick, tickSpacing, priceInverted })
        : undefined,
    [formattedData, currentTick, tickSpacing, priceInverted],
  )

  return {
    rawTicks,
    liquidityData,
    rawTicksLoading,
    liquidityDataLoading,
    error: ticksError ?? densityError,
  }
}

/**
 * The range chart's token colours on its display side of the price: token0's above the current tick and
 * token1's below, swapped when the price is inverted.
 */
export function useRangeChartTokenColors(
  sdkCurrencies: { [field in PositionField]: Maybe<Currency> },
  priceInverted: boolean,
): { token0Color: string; token1Color: string } {
  const sdkToken0Color = useColor(sdkCurrencies.TOKEN0 ?? undefined)
  const sdkToken1Color = useColor(sdkCurrencies.TOKEN1 ?? undefined)
  return priceInverted
    ? { token0Color: sdkToken1Color, token1Color: sdkToken0Color }
    : { token0Color: sdkToken0Color, token1Color: sdkToken1Color }
}
