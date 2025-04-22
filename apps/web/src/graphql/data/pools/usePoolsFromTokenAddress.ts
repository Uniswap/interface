import {
  PoolTableSortState,
  TablePool,
  V2_BIPS,
  calculate1DVolOverTvl,
  calculateApr,
  sortPools,
} from 'graphql/data/pools/useTopPools'
import { useCallback, useMemo, useRef } from 'react'
import {
  useTopV2PairsQuery,
  useTopV3PoolsQuery,
  useTopV4PoolsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const DEFAULT_QUERY_SIZE = 20

export function usePoolsFromTokenAddress(
  tokenAddress: string,
  sortState: PoolTableSortState,
  chainId?: UniverseChainId,
) {
  const { defaultChainId } = useEnabledChains()
  const chain = toGraphQLChain(chainId ?? defaultChainId)
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)
  const {
    loading: loadingV4,
    error: errorV4,
    data: dataV4,
    fetchMore: fetchMoreV4,
  } = useTopV4PoolsQuery({
    variables: {
      first: DEFAULT_QUERY_SIZE,
      tokenAddress,
      chain,
    },
    skip: !isV4DataEnabled,
  })
  const {
    loading: loadingV3,
    error: errorV3,
    data: dataV3,
    fetchMore: fetchMoreV3,
  } = useTopV3PoolsQuery({
    variables: {
      first: DEFAULT_QUERY_SIZE,
      tokenAddress,
      chain,
    },
  })

  const {
    loading: loadingV2,
    error: errorV2,
    data: dataV2,
    fetchMore: fetchMoreV2,
  } = useTopV2PairsQuery({
    variables: {
      first: DEFAULT_QUERY_SIZE,
      tokenAddress,
      chain,
    },
    skip: !chainId,
  })
  const loading = (loadingV4 && isV4DataEnabled) || loadingV3 || loadingV2

  const loadingMoreV4 = useRef(false)
  const loadingMoreV3 = useRef(false)
  const loadingMoreV2 = useRef(false)
  const sizeRef = useRef(DEFAULT_QUERY_SIZE)
  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if ((loadingMoreV4.current && isV4DataEnabled) || loadingMoreV3.current || loadingMoreV2.current) {
        return
      }
      loadingMoreV4.current = true
      loadingMoreV3.current = true
      loadingMoreV2.current = true
      sizeRef.current += DEFAULT_QUERY_SIZE
      fetchMoreV4({
        variables: {
          cursor: dataV4?.topV4Pools?.[dataV4.topV4Pools.length - 1]?.totalLiquidity?.value,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !prev || !Object.keys(prev).length) {
            loadingMoreV4.current = false
            return prev
          }
          if (!loadingMoreV3.current && !loadingMoreV2.current) {
            onComplete?.()
          }
          const mergedData = {
            topV4Pools: [...(prev.topV4Pools ?? []).slice(), ...(fetchMoreResult.topV4Pools ?? []).slice()],
          }
          loadingMoreV4.current = false
          return mergedData
        },
      })
      fetchMoreV3({
        variables: {
          cursor: dataV3?.topV3Pools?.[dataV3.topV3Pools.length - 1]?.totalLiquidity?.value,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !prev || !Object.keys(prev).length) {
            loadingMoreV3.current = false
            return prev
          }
          if (!loadingMoreV2.current && !loadingMoreV4.current) {
            onComplete?.()
          }
          const mergedData = {
            topV3Pools: [...(prev.topV3Pools ?? []).slice(), ...(fetchMoreResult.topV3Pools ?? []).slice()],
          }
          loadingMoreV3.current = false
          return mergedData
        },
      })
      fetchMoreV2({
        variables: {
          cursor: dataV2?.topV2Pairs?.[dataV2.topV2Pairs.length - 1]?.totalLiquidity?.value,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !prev || !Object.keys(prev).length) {
            loadingMoreV2.current = false
            return prev
          }
          if (!loadingMoreV3.current && !loadingMoreV4.current) {
            onComplete?.()
          }
          const mergedData = {
            topV2Pairs: [...(prev.topV2Pairs ?? []).slice(), ...(fetchMoreResult.topV2Pairs ?? []).slice()],
          }
          loadingMoreV2.current = false
          return mergedData
        },
      })
    },
    [
      dataV2?.topV2Pairs,
      dataV3?.topV3Pools,
      dataV4?.topV4Pools,
      fetchMoreV2,
      fetchMoreV3,
      fetchMoreV4,
      isV4DataEnabled,
    ],
  )

  return useMemo(() => {
    const topV4Pools: TablePool[] = isV4DataEnabled
      ? dataV4?.topV4Pools?.map((pool) => {
          return {
            hash: pool.poolId,
            token0: pool.token0,
            token1: pool.token1,
            tvl: pool.totalLiquidity?.value,
            volume24h: pool.volume24h?.value,
            volume30d: pool.volume30d?.value,
            volOverTvl: calculate1DVolOverTvl(pool.volume24h?.value, pool.totalLiquidity?.value),
            apr: calculateApr(pool.volume24h?.value, pool.totalLiquidity?.value, pool.feeTier),
            feeTier: pool.feeTier,
            protocolVersion: pool.protocolVersion,
            hookAddress: pool.hook?.address,
          } as TablePool
        }) ?? []
      : []
    const topV3Pools: TablePool[] =
      dataV3?.topV3Pools?.map((pool) => {
        return {
          hash: pool.address,
          token0: pool.token0,
          token1: pool.token1,
          tvl: pool.totalLiquidity?.value,
          volume24h: pool.volume24h?.value,
          volume30d: pool.volume30d?.value,
          volOverTvl: calculate1DVolOverTvl(pool.volume24h?.value, pool.totalLiquidity?.value),
          apr: calculateApr(pool.volume24h?.value, pool.totalLiquidity?.value, pool.feeTier),
          feeTier: pool.feeTier,
          protocolVersion: pool.protocolVersion,
        } as TablePool
      }) ?? []
    const topV2Pairs: TablePool[] =
      dataV2?.topV2Pairs?.map((pool) => {
        return {
          hash: pool.address,
          token0: pool.token0,
          token1: pool.token1,
          tvl: pool.totalLiquidity?.value,
          volume24h: pool.volume24h?.value,
          volume30d: pool.volume30d?.value,
          volOverTvl: calculate1DVolOverTvl(pool.volume24h?.value, pool.totalLiquidity?.value),
          apr: calculateApr(pool.volume24h?.value, pool.totalLiquidity?.value, V2_BIPS),
          feeTier: V2_BIPS,
          protocolVersion: pool.protocolVersion,
        } as TablePool
      }) ?? []

    const pools = sortPools([...topV4Pools, ...topV3Pools, ...topV2Pairs], sortState).slice(0, sizeRef.current)
    return { loading, errorV2, errorV3, errorV4, pools, loadMore }
  }, [
    dataV2?.topV2Pairs,
    dataV3?.topV3Pools,
    dataV4?.topV4Pools,
    errorV2,
    errorV3,
    errorV4,
    loadMore,
    loading,
    sortState,
    isV4DataEnabled,
  ])
}
