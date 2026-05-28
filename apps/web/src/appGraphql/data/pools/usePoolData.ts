/* eslint-disable import/no-unused-modules */
import { V2_BIPS } from 'appGraphql/data/pools/useTopPools'
import { useRingPoolQuery } from 'appGraphql/data/ring/useRingPoolQuery'
import ms from 'ms'
import { useMemo } from 'react'
import {
  Token as RingToken,
  V2PairDayData,
  V2PairHourData,
  V3PoolDayData,
  V3PoolHourData,
  V4PoolDayData,
  V4PoolHourData,
} from 'uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks'
import {
  Chain,
  ProtocolVersion,
  Token,
  useV2PairQuery,
  useV3PoolQuery,
  useV4PoolQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

interface RewardsCampaign {
  id: string
  boostedApr: number
  startTimestamp?: number
  endTimestamp?: number
  totalRewardAllocation?: string
  distributedRewards?: string
}

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

  // lp incentive rewards
  rewardsCampaign?: RewardsCampaign
}

export interface RingPoolData {
  // basic pool info
  idOrAddress: string
  feeTier?: number
  txCount?: number
  protocolVersion?: ProtocolVersion
  hookAddress?: string
  tickSpacing?: number

  // token info
  token0: RingToken
  tvlToken0?: number
  token0Price?: number

  token1: RingToken
  tvlToken1?: number
  token1Price?: number

  // volume
  volumeUSD24H?: number
  volumeUSD24HChange?: number

  // liquidity
  tvlUSD?: number
  // tvlUSDChange?: number

  hourData?: V2PairHourData[] | V3PoolHourData[] | V4PoolHourData[]
  dayData?: V2PairDayData[] | V3PoolDayData[] | V4PoolDayData[]
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
  const {
    loading: loadingV4,
    error: errorV4,
    data: dataV4,
  } = useV4PoolQuery({
    variables: { chain, poolId: poolIdOrAddress },
    errorPolicy: 'all',
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
            rewardsCampaign: 'rewardsCampaign' in pool ? pool.rewardsCampaign : undefined,
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

type PoolHourData = V2PairHourData | V3PoolHourData | V4PoolHourData

export function useRingPoolData(
  poolIdOrAddress: string,
  chain: Chain,
): {
  loading: boolean
  error: boolean
  data?: PoolData
} {
  const { loading, error, data } = useRingPoolQuery({ poolId: poolIdOrAddress, chain, skip: !chain })

  return useMemo(() => {
    const anyError = Boolean(error)
    const anyLoading = Boolean(loading)

    const pool = data?.v4Pool ?? data?.v3Pool ?? data?.v2Pair ?? undefined
    const feeTier = data?.v4Pool?.feeTier ?? data?.v3Pool?.feeTier ?? V2_BIPS
    const poolId = data?.v4Pool?.poolId ?? data?.v3Pool?.address ?? data?.v2Pair?.address ?? poolIdOrAddress
    const tvlToken0: number | undefined = data?.v2Pair
      ? Number(data.v2Pair.token0Supply)
      : data?.v3Pool
        ? Number(data.v3Pool.totalValueLockedToken0)
        : data?.v4Pool
          ? Number(data.v4Pool.totalValueLockedToken0)
          : undefined
    const tvlToken1: number | undefined = data?.v2Pair
      ? Number(data.v2Pair.token1Supply)
      : data?.v3Pool
        ? Number(data.v3Pool.totalValueLockedToken1)
        : data?.v4Pool
          ? Number(data.v4Pool.totalValueLockedToken1)
          : undefined

    const currentTime = new Date().getTime()
    const dayAgo = (currentTime - ms('1d')) / 1000

    const hourData = pool?.hourData?.items.map((item: any) => ({
      ...item,
      volumeUSD: Number(item.volumeUSD) ? Number(item.volumeUSD) : Number(item.untrackedVolumeUSD),
    }))

    const dayData = pool?.dayData?.items.map((item: any) => ({
      ...item,
      volumeUSD: Number(item.volumeUSD) ? Number(item.volumeUSD) : Number(item.untrackedVolumeUSD),
    }))

    const volume24h = hourData
      ? hourData
          .filter((entry: PoolHourData): entry is PoolHourData => entry?.date !== undefined && entry.date >= dayAgo)
          .reduce(
            (acc: any, cur: any) => acc + Number(Number(cur.volumeUSD) ? cur.volumeUSD : cur.untrackedVolumeUSD),
            0,
          )
      : 0

    return {
      data: pool
        ? {
            idOrAddress: poolId,
            txCount: pool.txCount,
            protocolVersion: pool.protocolVersion,
            token0: pool.token0 as Token,
            tvlToken0,
            token0Price: Number(pool.token0Price),
            token1: pool.token1 as Token,
            tvlToken1,
            token1Price: Number(pool.token1Price),
            feeTier,
            volumeUSD24H: volume24h,
            volumeUSD24HChange: calc24HVolChange(hourData),
            tvlUSD: pool.totalValueLockedUSD ? Number(pool.totalValueLockedUSD) : undefined,
            // tvlUSDChange: pool.totalLiquidityPercentChange24h?.value,
            hookAddress: 'hooks' in pool ? pool?.hooks : undefined,
            hourData,
            dayData,
          }
        : undefined,
      error: anyError,
      loading: anyLoading,
    }
  }, [data?.v2Pair, data?.v3Pool, data?.v4Pool, error, loading, poolIdOrAddress])
}
