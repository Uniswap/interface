import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Token, V3_CORE_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { FeeAmount, Pool as V3Pool, tickToPrice as tickToPriceV3 } from '@uniswap/v3-sdk'
import { Pool as V4Pool, tickToPrice as tickToPriceV4 } from '@uniswap/v4-sdk'
import { ZERO_ADDRESS } from 'constants/misc'
import { TickData, Ticks } from 'graphql/data/AllV3TicksQuery'
import JSBI from 'jsbi'
import ms from 'ms'
import { getCurrencyAddressWithWrap, poolEnabledProtocolVersion } from 'pages/Pool/Positions/create/utils'
import { useEffect, useMemo, useState } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import {
  useAllV3TicksQuery,
  useAllV4TicksQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { logger } from 'utilities/src/logger/logger'
import computeSurroundingTicks, { TickProcessed } from 'utils/computeSurroundingTicks'

const PRICE_FIXED_DIGITS = 8

const getActiveTick = (
  tickCurrent: number | undefined,
  feeAmount: FeeAmount | undefined,
  tickSpacing: number | undefined,
) => (tickCurrent && feeAmount && tickSpacing ? Math.floor(tickCurrent / tickSpacing) * tickSpacing : undefined)

const MAX_TICK_FETCH_VALUE = 1000
function usePaginatedTickQuery(
  poolId: string | undefined,
  version: ProtocolVersion,
  skip = 0,
  chainId: UniverseChainId,
) {
  const { defaultChainId } = useEnabledChains()
  const supportedChainId = useSupportedChainId(chainId)

  const v3Result = useAllV3TicksQuery({
    variables: {
      address: poolId?.toLowerCase() ?? '',
      chain: toGraphQLChain(supportedChainId ?? defaultChainId),
      skip,
      first: MAX_TICK_FETCH_VALUE,
    },
    skip: !poolId || version !== ProtocolVersion.V3,
    pollInterval: ms(`30s`),
  })

  const v4Result = useAllV4TicksQuery({
    variables: {
      poolId: poolId ?? '',
      chain: toGraphQLChain(supportedChainId ?? defaultChainId),
      skip,
      first: MAX_TICK_FETCH_VALUE,
    },
    skip: !poolId || version !== ProtocolVersion.V4,
    pollInterval: ms(`30s`),
  })

  return useMemo(() => {
    if (version === ProtocolVersion.V3) {
      return v3Result
    } else if (version === ProtocolVersion.V4) {
      return v4Result
    }
    return {
      data: undefined,
      error: new Error('Invalid version'),
      loading: false,
    }
  }, [v3Result, v4Result, version])
}

// Fetches all ticks for a given pool
function useAllPoolTicks({
  currencyA,
  currencyB,
  feeAmount,
  chainId,
  version,
  tickSpacing,
  hooks,
  precalculatedPoolId,
}: {
  currencyA?: Currency
  currencyB?: Currency
  feeAmount?: FeeAmount
  chainId: UniverseChainId
  version: ProtocolVersion
  tickSpacing?: number
  hooks?: string
  precalculatedPoolId?: string
}): {
  isLoading: boolean
  error: unknown
  ticks?: TickData[]
} {
  const [skipNumber, setSkipNumber] = useState(0)

  const [tickData, setTickData] = useState<Ticks>([])

  const poolId = useMemo(() => {
    if (precalculatedPoolId) {
      return precalculatedPoolId
    }
    const v3PoolAddress =
      currencyA && currencyB && feeAmount && version === ProtocolVersion.V3
        ? V3Pool.getAddress(
            currencyA?.wrapped,
            currencyB?.wrapped,
            feeAmount,
            undefined,
            chainId ? V3_CORE_FACTORY_ADDRESSES[chainId] : undefined,
          )
        : undefined

    const v4PoolId =
      version === ProtocolVersion.V4 && currencyA && currencyB && feeAmount && tickSpacing && hooks
        ? V4Pool.getPoolId(currencyA, currencyB, feeAmount, tickSpacing, hooks)
        : undefined
    return version === ProtocolVersion.V3 ? v3PoolAddress : v4PoolId
  }, [chainId, currencyA, currencyB, feeAmount, hooks, precalculatedPoolId, tickSpacing, version])

  const { data, error, loading: isLoading } = usePaginatedTickQuery(poolId, version, skipNumber, chainId)
  // TODO: fix typing on usePaginatedTickQuery function to avoid casting to any
  const ticks: Ticks = ((data as any)?.v3Pool?.ticks as Ticks) ?? ((data as any)?.v4Pool?.ticks as Ticks)

  useEffect(() => {
    if (ticks?.length) {
      setTickData((tickData) => [...tickData, ...ticks])
      if (ticks?.length === MAX_TICK_FETCH_VALUE) {
        setSkipNumber((skipNumber) => skipNumber + MAX_TICK_FETCH_VALUE)
      }
    }
  }, [ticks])

  return {
    isLoading: isLoading || ticks?.length === MAX_TICK_FETCH_VALUE,
    error,
    ticks: tickData,
  }
}

export function usePoolActiveLiquidity({
  currencyA,
  currencyB,
  feeAmount,
  chainId,
  version,
  tickSpacing,
  hooks,
  poolId,
  skip,
}: {
  poolId?: string
  currencyA?: Currency
  currencyB?: Currency
  feeAmount?: number
  version: ProtocolVersion
  chainId?: UniverseChainId
  tickSpacing?: number
  hooks?: string
  skip?: boolean
}): {
  isLoading: boolean
  error: any
  currentTick?: number
  activeTick?: number
  liquidity?: JSBI
  sqrtPriceX96?: JSBI
  data?: TickProcessed[]
} {
  const multichainContext = useMultichainContext()
  const defaultChainId = multichainContext.chainId ?? UniverseChainId.Mainnet
  const poolsQueryEnabled = Boolean(poolEnabledProtocolVersion(version) && currencyA && currencyB && !skip)
  const { data: poolData, isLoading: poolIsLoading } = useGetPoolsByTokens(
    {
      fee: feeAmount,
      chainId: chainId ?? defaultChainId,
      protocolVersions: [version],
      token0: getCurrencyAddressWithWrap(currencyA, version),
      token1: getCurrencyAddressWithWrap(currencyB, version),
      hooks: hooks ?? ZERO_ADDRESS,
    },
    poolsQueryEnabled,
  )

  const pool = poolData?.pools && poolData.pools.length > 0 ? poolData.pools[0] : undefined

  const liquidity = pool?.liquidity
  const sqrtPriceX96 = pool?.sqrtPriceX96

  const currentTick = pool?.tick
  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick = useMemo(
    () => getActiveTick(currentTick, feeAmount, tickSpacing),
    [currentTick, feeAmount, tickSpacing],
  )

  const { isLoading, error, ticks } = useAllPoolTicks({
    currencyA,
    currencyB,
    feeAmount,
    precalculatedPoolId: poolId,
    chainId: chainId ?? defaultChainId,
    version: version ?? ProtocolVersion.V3,
    tickSpacing,
    hooks,
  })

  return useMemo(() => {
    if (!currencyA || !currencyB || activeTick === undefined || !pool || !ticks || ticks.length === 0 || isLoading) {
      return {
        isLoading: isLoading || poolIsLoading,
        error,
        activeTick,
        data: undefined,
      }
    }

    const token0 = version === ProtocolVersion.V3 ? currencyA?.wrapped : currencyA
    const token1 = version === ProtocolVersion.V3 ? currencyB?.wrapped : currencyB

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    const pivot = ticks.findIndex((tickData) => tickData?.tick && tickData.tick > activeTick) - 1

    if (pivot < 0) {
      // consider setting a local error
      logger.debug('usePoolTickData', 'usePoolActiveLiquidity', 'TickData pivot not found', {
        token0: token0.isToken ? token0.address : ZERO_ADDRESS,
        token1: token1.isToken ? token1.address : ZERO_ADDRESS,
        chainId: token0.chainId,
      })
      return {
        isLoading,
        error,
        activeTick,
        data: undefined,
      }
    }

    let sdkPrice
    try {
      sdkPrice =
        version === ProtocolVersion.V3
          ? tickToPriceV3(token0 as Token, token1 as Token, activeTick)
          : tickToPriceV4(token0, token1, activeTick)
    } catch (e) {
      logger.debug('usePoolTickData', 'usePoolActiveLiquidity', 'Error getting price', {
        error: e,
        token0: token0.isToken ? token0.address : ZERO_ADDRESS,
        token1: token1.isToken ? token1.address : ZERO_ADDRESS,
        chainId: token0.chainId,
      })

      return {
        isLoading,
        error,
        activeTick,
        data: undefined,
      }
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: JSBI.BigInt(pool?.liquidity ?? 0),
      tick: activeTick,
      liquidityNet:
        Number(ticks[pivot]?.tick) === activeTick ? JSBI.BigInt(ticks[pivot]?.liquidityNet ?? 0) : JSBI.BigInt(0),
      price0: sdkPrice.toFixed(PRICE_FIXED_DIGITS),
      sdkPrice,
    }

    const subsequentTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, true, version)

    const previousTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, false, version)

    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

    return {
      isLoading,
      error,
      currentTick,
      activeTick,
      liquidity: JSBI.BigInt(liquidity ?? 0),
      sqrtPriceX96: JSBI.BigInt(sqrtPriceX96 ?? 0),
      data: ticksProcessed,
    }
  }, [
    currencyA,
    currencyB,
    activeTick,
    pool,
    ticks,
    isLoading,
    version,
    error,
    currentTick,
    liquidity,
    sqrtPriceX96,
    poolIsLoading,
  ])
}
