import { V2_BIPS } from 'graphql/data/pools/useTopPools'
import ms from 'ms'
import { useMemo } from 'react'
import {
  ProtocolVersion,
  Token,
  useV2PairQuery,
  useV3PoolQuery,
  useV4PoolQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export interface PoolData {
  // basic pool info
  idOrAddress: string
  feeTier?: number
  txCount?: number
  protocolVersion?: ProtocolVersion
  hookAddress?: string
  tickSpacing?: number

  // token info
  token0: Token
  tvlToken0?: number
  token0Price?: number

  token1: Token
  tvlToken1?: number
  token1Price?: number

  // volume
  volumeUSD24H?: number
  volumeUSD24HChange?: number

  // liquidity
  tvlUSD?: number
  tvlUSDChange?: number
}

type VolumeChange = { value: number; timestamp: number }

/**
 * Given an array of historical volume, calculate the 24h % change in volume
 */
function calc24HVolChange(historicalVolume?: (VolumeChange | undefined)[]) {
  if (!historicalVolume) {
    return undefined
  }
  const currentTime = new Date().getTime()
  const dayAgo = (currentTime - ms('1d')) / 1000
  const twoDaysAgo = (currentTime - ms('2d')) / 1000

  const volume24h = historicalVolume
    .filter((entry): entry is VolumeChange => entry?.timestamp !== undefined && entry.timestamp >= dayAgo)
    .reduce((acc, cur) => acc + cur.value, 0)
  const volume48h = historicalVolume
    .filter(
      (entry): entry is VolumeChange =>
        entry?.timestamp !== undefined && entry.timestamp >= twoDaysAgo && entry.timestamp < dayAgo,
    )
    .reduce((acc, cur) => acc + cur.value, 0)
  return ((volume24h - volume48h) / volume48h) * 100
}

/**
 * Queries v4, v3, and v2 for pool data
 * @param poolIdOrAddress
 * @param chainId
 * @returns
 */
export function usePoolData(
  poolIdOrAddress: string,
  chainId?: UniverseChainId,
): {
  loading: boolean
  error: boolean
  data?: PoolData
} {
  const { defaultChainId } = useEnabledChains()
  const chain = toGraphQLChain(chainId ?? defaultChainId)
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)
  const {
    loading: loadingV4,
    error: errorV4,
    data: dataV4,
  } = useV4PoolQuery({
    variables: { chain, poolId: poolIdOrAddress },
    errorPolicy: 'all',
    skip: !isV4DataEnabled,
  })
  const {
    loading: loadingV3,
    error: errorV3,
    data: dataV3,
  } = useV3PoolQuery({
    variables: { chain, address: poolIdOrAddress },
    errorPolicy: 'all',
  })
  const {
    loading: loadingV2,
    error: errorV2,
    data: dataV2,
  } = useV2PairQuery({
    variables: { chain, address: poolIdOrAddress },
    skip: !chainId,
    errorPolicy: 'all',
  })

  return useMemo(() => {
    const anyError = Boolean(errorV4 || errorV3 || errorV2)
    const anyLoading = Boolean(loadingV4 || loadingV3 || loadingV2)

    const pool = dataV4?.v4Pool ?? dataV3?.v3Pool ?? dataV2?.v2Pair ?? undefined
    const feeTier = dataV4?.v4Pool?.feeTier ?? dataV3?.v3Pool?.feeTier ?? V2_BIPS
    const poolId = dataV4?.v4Pool?.poolId ?? dataV3?.v3Pool?.address ?? dataV2?.v2Pair?.address ?? poolIdOrAddress

    return {
      data: pool
        ? {
            idOrAddress: poolId,
            txCount: pool.txCount,
            protocolVersion: pool.protocolVersion,
            token0: pool.token0 as Token,
            tvlToken0: pool.token0Supply,
            token0Price: pool.token0?.project?.markets?.[0]?.price?.value ?? pool.token0?.market?.price?.value,
            token1: pool.token1 as Token,
            tvlToken1: pool.token1Supply,
            token1Price: pool.token1?.project?.markets?.[0]?.price?.value ?? pool.token1?.market?.price?.value,
            feeTier,
            volumeUSD24H: pool.volume24h?.value,
            volumeUSD24HChange: calc24HVolChange(pool.historicalVolume?.concat()),
            tvlUSD: pool.totalLiquidity?.value,
            tvlUSDChange: pool.totalLiquidityPercentChange24h?.value,
            hookAddress: 'hook' in pool ? pool?.hook?.address : undefined,
          }
        : undefined,
      error: anyError,
      loading: anyLoading,
    }
  }, [
    dataV2?.v2Pair,
    dataV3?.v3Pool,
    dataV4?.v4Pool,
    errorV2,
    errorV3,
    errorV4,
    loadingV2,
    loadingV3,
    loadingV4,
    poolIdOrAddress,
  ])
}
