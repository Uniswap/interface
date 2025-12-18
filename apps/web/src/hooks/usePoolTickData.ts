import { TickData, Ticks } from 'appGraphql/data/AllV3TicksQuery'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Token, V3_CORE_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS, tickToPrice as tickToPriceV3, Pool as V3Pool } from '@uniswap/v3-sdk'
import { tickToPrice as tickToPriceV4, Pool as V4Pool } from '@uniswap/v4-sdk'
import { GraphQLApi } from '@universe/api'
import { getTokenOrZeroAddress } from 'components/Liquidity/utils/currency'
import { poolEnabledProtocolVersion } from 'components/Liquidity/utils/protocolVersion'
import JSBI from 'jsbi'
import ms from 'ms'
import { useEffect, useMemo, useState } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { PositionField } from 'types/position'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import computeSurroundingTicks, { TickProcessed } from 'utils/computeSurroundingTicks'

const PRICE_FIXED_DIGITS = 8

function getActiveTick({
  tickCurrent,
  feeAmount,
  tickSpacing,
}: {
  tickCurrent?: number
  feeAmount?: FeeAmount
  tickSpacing?: number
}): number | undefined {
  return tickCurrent !== undefined && feeAmount !== undefined && tickSpacing
    ? Math.floor(tickCurrent / tickSpacing) * tickSpacing
    : undefined
}

const MAX_TICK_FETCH_VALUE = 1000
function usePaginatedTickQuery({
  poolId,
  version,
  skip,
  chainId,
}: {
  poolId?: string
  version: ProtocolVersion
  skip?: number
  chainId: UniverseChainId
}) {
  const { defaultChainId } = useEnabledChains()
  const supportedChainId = useSupportedChainId(chainId)

  const v3Result = GraphQLApi.useAllV3TicksQuery({
    variables: {
      address: normalizeAddress(poolId ?? '', AddressStringFormat.Lowercase),
      chain: toGraphQLChain(supportedChainId ?? defaultChainId),
      skip,
      first: MAX_TICK_FETCH_VALUE,
    },
    skip: !poolId || version !== ProtocolVersion.V3,
    pollInterval: ms(`30s`),
  })

  const v4Result = GraphQLApi.useAllV4TicksQuery({
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
  sdkCurrencies,
  feeAmount,
  chainId,
  version,
  tickSpacing,
  hooks,
  precalculatedPoolId,
}: {
  sdkCurrencies: { [field in PositionField]: Maybe<Currency> }
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
    const { TOKEN0, TOKEN1 } = sdkCurrencies
    const v3PoolAddress =
      TOKEN0 && TOKEN1 && feeAmount && version === ProtocolVersion.V3
        ? V3Pool.getAddress(TOKEN0.wrapped, TOKEN1.wrapped, feeAmount, undefined, V3_CORE_FACTORY_ADDRESSES[chainId])
        : undefined

    const v4PoolId =
      version === ProtocolVersion.V4 && TOKEN0 && TOKEN1 && feeAmount && tickSpacing && hooks
        ? V4Pool.getPoolId(TOKEN0, TOKEN1, feeAmount, tickSpacing, hooks)
        : undefined
    return version === ProtocolVersion.V3 ? v3PoolAddress : v4PoolId
  }, [chainId, sdkCurrencies, feeAmount, hooks, precalculatedPoolId, tickSpacing, version])

  const {
    data,
    error,
    loading: isLoading,
  } = usePaginatedTickQuery({
    poolId,
    version,
    skip: skipNumber,
    chainId,
  })
  // TODO: fix typing on usePaginatedTickQuery function to avoid casting to any
  const ticks: Ticks | undefined =
    ((data as any)?.v3Pool?.ticks as Ticks | undefined) ?? ((data as any)?.v4Pool?.ticks as Ticks | undefined)

  useEffect(() => {
    if (ticks?.length) {
      setTickData((tickData) => [...tickData, ...ticks])
      if (ticks.length === MAX_TICK_FETCH_VALUE) {
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
  sdkCurrencies,
  feeAmount,
  chainId,
  version,
  tickSpacing,
  hooks,
  poolId,
  skip,
}: {
  poolId?: string
  sdkCurrencies: { [field in PositionField]: Maybe<Currency> }
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
  const poolsQueryEnabled = Boolean(
    poolEnabledProtocolVersion(version) && sdkCurrencies.TOKEN0 && sdkCurrencies.TOKEN1 && !skip,
  )
  const { data: poolData, isLoading: poolIsLoading } = useGetPoolsByTokens(
    {
      fee: feeAmount,
      chainId: chainId ?? defaultChainId,
      protocolVersions: [version],
      token0: getTokenOrZeroAddress(sdkCurrencies.TOKEN0),
      token1: getTokenOrZeroAddress(sdkCurrencies.TOKEN1),
      hooks: hooks ?? ZERO_ADDRESS,
    },
    poolsQueryEnabled,
  )

  const pool = poolData?.pools && poolData.pools.length > 0 ? poolData.pools[0] : undefined
  const tickSpacingWithFallback =
    tickSpacing ?? pool?.tickSpacing ?? (feeAmount ? TICK_SPACINGS[feeAmount as FeeAmount] : undefined)

  const liquidity = pool?.liquidity
  const sqrtPriceX96 = pool?.sqrtPriceX96

  const currentTick = pool?.tick
  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick = useMemo(
    () =>
      getActiveTick({
        tickCurrent: currentTick,
        feeAmount,
        tickSpacing: tickSpacingWithFallback,
      }),
    [currentTick, feeAmount, tickSpacingWithFallback],
  )

  const { isLoading, error, ticks } = useAllPoolTicks({
    sdkCurrencies,
    feeAmount,
    precalculatedPoolId: poolId,
    chainId: chainId ?? defaultChainId,
    version,
    tickSpacing: tickSpacingWithFallback,
    hooks,
  })

  return useMemo(() => {
    const token0 = sdkCurrencies.TOKEN0
    const token1 = sdkCurrencies.TOKEN1

    if (!token0 || !token1 || activeTick === undefined || !pool || !ticks || ticks.length === 0 || isLoading) {
      return {
        isLoading: isLoading || poolIsLoading,
        error,
        activeTick,
        data: undefined,
      }
    }

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
      liquidityActive: JSBI.BigInt(pool.liquidity),
      tick: activeTick,
      liquidityNet:
        Number(ticks[pivot]?.tick) === activeTick ? JSBI.BigInt(ticks[pivot]?.liquidityNet ?? 0) : JSBI.BigInt(0),
      price0: sdkPrice.toFixed(PRICE_FIXED_DIGITS),
      sdkPrice,
    }

    const subsequentTicks = computeSurroundingTicks({
      token0,
      token1,
      activeTickProcessed,
      sortedTickData: ticks,
      pivot,
      ascending: true,
      version,
    })

    const previousTicks = computeSurroundingTicks({
      token0,
      token1,
      activeTickProcessed,
      sortedTickData: ticks,
      pivot,
      ascending: false,
      version,
    })

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
    sdkCurrencies,
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
