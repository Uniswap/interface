import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi, parseRestProtocolVersion } from '@universe/api'
import { useCallback, useMemo, useRef } from 'react'
import { DEFAULT_TICK_SPACING, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { removeDuplicatesBy } from 'utilities/src/primitives/array'
import { supportedChainIdFromGQLChain } from '~/data/chainUtils'
import { calculate1DVolOverTvl, calculateApr, PoolTableSortState, sortPools, TablePool } from '~/data/pools/useTopPools'
import { servedFeeKey, useServedProtocolFees, type ServedProtocolFeePool } from '~/features/fees/useServedProtocolFees'

const DEFAULT_QUERY_SIZE = 20

export function usePoolsFromTokenAddress({
  tokenAddress,
  sortState,
  chainId,
  isNative,
  multichain,
}: {
  tokenAddress: string
  sortState: PoolTableSortState
  chainId: UniverseChainId
  isNative?: boolean
  multichain?: boolean
}) {
  const chain = toGraphQLChain(chainId)
  const skipPoolQueries = isSVMChain(chainId)

  const {
    loading: loadingV4,
    error: errorV4,
    data: dataV4,
    fetchMore: fetchMoreV4,
  } = GraphQLApi.useTopV4PoolsQuery({
    variables: {
      first: DEFAULT_QUERY_SIZE,
      tokenAddress: isNative ? DEFAULT_NATIVE_ADDRESS : tokenAddress,
      chain,
      multichain,
    },
    skip: skipPoolQueries,
  })

  const {
    loading: loadingV3,
    error: errorV3,
    data: dataV3,
    fetchMore: fetchMoreV3,
  } = GraphQLApi.useTopV3PoolsQuery({
    variables: {
      first: DEFAULT_QUERY_SIZE,
      tokenAddress,
      chain,
      multichain,
    },
    skip: skipPoolQueries,
  })

  const {
    loading: loadingV2,
    error: errorV2,
    data: dataV2,
    fetchMore: fetchMoreV2,
  } = GraphQLApi.useTopV2PairsQuery({
    variables: {
      first: DEFAULT_QUERY_SIZE,
      tokenAddress,
      chain,
      multichain,
    },
    skip: skipPoolQueries,
  })
  const loading = loadingV4 || loadingV3 || loadingV2

  const loadingMoreV4 = useRef(false)
  const loadingMoreV3 = useRef(false)
  const loadingMoreV2 = useRef(false)
  const sizeRef = useRef(DEFAULT_QUERY_SIZE)
  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMoreV4.current || loadingMoreV3.current || loadingMoreV2.current) {
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
          if (!Object.keys(prev).length) {
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
          if (!Object.keys(prev).length) {
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
          if (!Object.keys(prev).length) {
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
    [dataV2?.topV2Pairs, dataV3?.topV3Pools, dataV4?.topV4Pools, fetchMoreV2, fetchMoreV3, fetchMoreV4],
  )

  // GraphQL pool queries carry no fee fields — the per-pool protocol fee comes from batched GetProtocolFees.
  const protocolFeePools = useMemo<ServedProtocolFeePool[]>(() => {
    const result: ServedProtocolFeePool[] = []
    const add = (
      pool: { token0?: { chain: GraphQLApi.Chain }; protocolVersion: GraphQLApi.ProtocolVersion },
      poolIdOrHash: string,
    ) => {
      const resolvedChainId = pool.token0 ? supportedChainIdFromGQLChain(pool.token0.chain) : chainId
      const protocolVersion = parseRestProtocolVersion(pool.protocolVersion)
      if (resolvedChainId !== undefined && protocolVersion !== undefined) {
        result.push({ chainId: resolvedChainId, protocolVersion, poolIdOrHash })
      }
    }
    for (const pool of dataV4?.topV4Pools ?? []) {
      add(pool, pool.poolId)
    }
    for (const pool of dataV3?.topV3Pools ?? []) {
      add(pool, pool.address)
    }
    for (const pool of dataV2?.topV2Pairs ?? []) {
      add(pool, pool.address)
    }
    return result
  }, [dataV2?.topV2Pairs, dataV3?.topV3Pools, dataV4?.topV4Pools, chainId])
  const servedProtocolFees = useServedProtocolFees({ pools: protocolFeePools, enabled: !skipPoolQueries })

  return useMemo(() => {
    const resolveServedFee = (poolChain: GraphQLApi.Chain | undefined, poolIdOrHash: string): number | undefined => {
      const resolvedChainId = poolChain ? supportedChainIdFromGQLChain(poolChain) : chainId
      return resolvedChainId === undefined
        ? undefined
        : servedProtocolFees.get(servedFeeKey({ chainId: resolvedChainId, poolIdOrHash }))?.protocolFee
    }
    const topV4Pools: TablePool[] =
      dataV4?.topV4Pools?.map((pool) => {
        const protocolFeePips = resolveServedFee(pool.token0?.chain, pool.poolId)
        return {
          hash: pool.poolId,
          token0: pool.token0,
          token1: pool.token1,
          tvl: pool.totalLiquidity?.value,
          volume24h: pool.volume24h?.value,
          volume30d: pool.volume30d?.value,
          volOverTvl: calculate1DVolOverTvl(pool.volume24h?.value, pool.totalLiquidity?.value),
          // Table APR keeps its numeric-cell contract (unlike PoolInfoCard/PoolDetails, which blank
          // out for dynamic-fee pools); falls back to 0 since this call site doesn't feed isDynamic
          // through, so undefined here would only ever come from missing volume/TVL data.
          apr:
            calculateApr({
              volume24h: pool.volume24h?.value,
              tvl: pool.totalLiquidity?.value,
              feeTier: pool.feeTier,
              protocolVersion: parseRestProtocolVersion(pool.protocolVersion),
              protocolFeePips,
            }) ?? new Percent(0),
          feeTier: pool.feeTier
            ? {
                feeAmount: pool.feeTier,
                tickSpacing: DEFAULT_TICK_SPACING,
                isDynamic: pool.isDynamicFee ?? false,
              }
            : undefined,
          protocolVersion: pool.protocolVersion,
          hookAddress: pool.hook?.address,
          protocolFeePips,
        } as TablePool
      }) ?? []

    const topV3Pools: TablePool[] =
      dataV3?.topV3Pools?.map((pool) => {
        const protocolFeePips = resolveServedFee(pool.token0?.chain, pool.address)
        return {
          hash: pool.address,
          token0: pool.token0,
          token1: pool.token1,
          tvl: pool.totalLiquidity?.value,
          volume24h: pool.volume24h?.value,
          volume30d: pool.volume30d?.value,
          volOverTvl: calculate1DVolOverTvl(pool.volume24h?.value, pool.totalLiquidity?.value),
          // Table APR keeps its numeric-cell contract (unlike PoolInfoCard/PoolDetails, which blank
          // out for dynamic-fee pools); falls back to 0 since this call site doesn't feed isDynamic
          // through, so undefined here would only ever come from missing volume/TVL data.
          apr:
            calculateApr({
              volume24h: pool.volume24h?.value,
              tvl: pool.totalLiquidity?.value,
              feeTier: pool.feeTier,
              protocolVersion: parseRestProtocolVersion(pool.protocolVersion),
              protocolFeePips,
            }) ?? new Percent(0),
          feeTier: pool.feeTier
            ? {
                feeAmount: pool.feeTier,
                tickSpacing: DEFAULT_TICK_SPACING,
                isDynamic: false,
              }
            : undefined,
          protocolVersion: pool.protocolVersion,
          protocolFeePips,
        } as TablePool
      }) ?? []
    const topV2Pairs: TablePool[] =
      dataV2?.topV2Pairs?.map((pool) => {
        const protocolFeePips = resolveServedFee(pool.token0?.chain, pool.address)
        return {
          hash: pool.address,
          token0: pool.token0,
          token1: pool.token1,
          tvl: pool.totalLiquidity?.value,
          volume24h: pool.volume24h?.value,
          volume30d: pool.volume30d?.value,
          volOverTvl: calculate1DVolOverTvl(pool.volume24h?.value, pool.totalLiquidity?.value),
          apr:
            calculateApr({
              volume24h: pool.volume24h?.value,
              tvl: pool.totalLiquidity?.value,
              feeTier: V2_DEFAULT_FEE_TIER,
              protocolVersion: parseRestProtocolVersion(pool.protocolVersion),
              protocolFeePips,
            }) ?? new Percent(0),
          feeTier: {
            feeAmount: V2_DEFAULT_FEE_TIER,
            tickSpacing: DEFAULT_TICK_SPACING,
            isDynamic: false,
          },
          protocolVersion: pool.protocolVersion,
          protocolFeePips,
        } as TablePool
      }) ?? []

    const pools = sortPools(removeDuplicatesBy([...topV4Pools, ...topV3Pools, ...topV2Pairs], 'hash'), sortState).slice(
      0,
      sizeRef.current,
    )
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
    servedProtocolFees,
    chainId,
  ])
}
