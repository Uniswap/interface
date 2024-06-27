import { ChainId } from '@uniswap/sdk-core'
import { SupportedInterfaceChainId, chainIdToBackendChain } from 'constants/chains'
import { V2_BIPS } from 'graphql/data/pools/useTopPools'
import ms from 'ms'
import { useMemo } from 'react'
import {
  ProtocolVersion,
  Token,
  useV2PairQuery,
  useV3PoolQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export interface PoolData {
  // basic pool info
  address: string
  feeTier?: number
  txCount?: number
  protocolVersion?: ProtocolVersion

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
        entry?.timestamp !== undefined && entry.timestamp >= twoDaysAgo && entry.timestamp < dayAgo
    )
    .reduce((acc, cur) => acc + cur.value, 0)
  return ((volume24h - volume48h) / volume48h) * 100
}

/**
 * Queries both v3 and v2 for pool data
 * @param poolAddress
 * @param chainId
 * @returns
 */
export function usePoolData(
  poolAddress: string,
  chainId?: SupportedInterfaceChainId
): {
  loading: boolean
  error: boolean
  data?: PoolData
} {
  const v2ExploreEnabled = useFeatureFlag(FeatureFlags.V2Explore)
  const {
    loading: loadingV3,
    error: errorV3,
    data: dataV3,
  } = useV3PoolQuery({
    variables: { chain: chainIdToBackendChain({ chainId, withFallback: true }), address: poolAddress },
    errorPolicy: 'all',
  })
  const {
    loading: loadingV2,
    error: errorV2,
    data: dataV2,
  } = useV2PairQuery({
    variables: { chain: chainIdToBackendChain({ chainId, withFallback: true }), address: poolAddress },
    skip: !chainId || (chainId !== ChainId.MAINNET && !v2ExploreEnabled),
    errorPolicy: 'all',
  })

  return useMemo(() => {
    const anyError = Boolean(errorV3 || (errorV2 && (chainId === ChainId.MAINNET || v2ExploreEnabled)))
    const anyLoading = Boolean(loadingV3 || (loadingV2 && (chainId === ChainId.MAINNET || v2ExploreEnabled)))

    const pool = dataV3?.v3Pool ?? dataV2?.v2Pair ?? undefined
    const feeTier = dataV3?.v3Pool?.feeTier ?? V2_BIPS

    return {
      data: pool
        ? {
            address: pool.address,
            txCount: pool.txCount,
            protocolVersion: pool.protocolVersion,
            token0: pool.token0 as Token,
            tvlToken0: pool.token0Supply,
            token0Price: pool.token0?.project?.markets?.[0]?.price?.value,
            token1: pool.token1 as Token,
            tvlToken1: pool.token1Supply,
            token1Price: pool.token1?.project?.markets?.[0]?.price?.value,
            feeTier,
            volumeUSD24H: pool.volume24h?.value,
            volumeUSD24HChange: calc24HVolChange(pool.historicalVolume?.concat()),
            tvlUSD: pool.totalLiquidity?.value,
            tvlUSDChange: pool.totalLiquidityPercentChange24h?.value,
          }
        : undefined,
      error: anyError,
      loading: anyLoading,
    }
  }, [chainId, dataV2?.v2Pair, dataV3?.v3Pool, errorV2, errorV3, loadingV2, loadingV3, v2ExploreEnabled])
}
