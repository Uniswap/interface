import { PartialMessage, PlainMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { search } from '@uniswap/client-data-api/dist/data/v2/search-SearchService_connectquery'
import { SearchRequest, SearchResponse } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import { RankedPool } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { normalizeBackendNativeAddress } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/transport'
import { PoolSearchResult, PoolSearchStats } from 'uniswap/src/features/dataApi/types'
import { SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

/**
 * Wrapper around Tanstack useQuery for the data.v2 SearchService (Search V2 PRD).
 * One request covers every requested result type (tokens, pools, auctions, categories)
 * via `input.types`; the response buckets tokens into default and suppressed.
 * @param input - The search request parameters including search query, chain IDs, result types, and per-type max results
 * @returns data, error, isPending, and refetch
 */
export function useSearchQuery<TSelectType>({
  input,
  enabled = true,
  select,
}: {
  input?: PartialMessage<SearchRequest>
  enabled?: boolean
  select?: ((data: SearchResponse) => TSelectType) | undefined
}): UseQueryResult<TSelectType, ConnectError> {
  return useQuery(search, input, {
    transport: entryGatewayProdPostTransport,
    enabled: !!input && enabled,
    select,
  })
}

function buildPoolSearchStats(rankedPool: RankedPool | PlainMessage<RankedPool>): PoolSearchStats | undefined {
  const stats: PoolSearchStats = {
    volume1dUsd: rankedPool.stats?.volume1d,
    apr: rankedPool.stats?.apr,
  }
  // Object.values drops `undefined` from optional props, so re-widen or the check looks always-true
  const hasAny = Object.values(stats).some((value: number | undefined) => value !== undefined)
  return hasAny ? stats : undefined
}

/**
 * Converts a data.v2 RankedPool into the app-layer PoolSearchResult (the persisted
 * PoolSearchHistoryResult identity shape plus volatile display stats). Returns undefined when the
 * pool is missing either token, has an unspecified protocol version, or has no resolvable fee tier.
 * Accepts the plain shape too, so ListPools pages (stored as PlainMessage for persistence) convert as-is.
 */
export function rankedPoolToPoolSearchResult(
  rankedPool: RankedPool | PlainMessage<RankedPool>,
): PoolSearchResult | undefined {
  const pool = rankedPool.pool
  if (!pool?.token0 || !pool.token1 || pool.protocolVersion === ProtocolVersion.UNSPECIFIED) {
    return undefined
  }

  // Served for every protocol version: the pool key's fee for a v4 dynamic pool, the fixed 0.30% for
  // a V2 pair. A row without one can't key into a tier, so it's dropped — if V2 pairs or dynamic
  // pools ever vanish from pool search, the serializer stopped populating fee_tier, not this guard.
  const feeTier = pool.feeTier
  if (feeTier === undefined) {
    return undefined
  }

  const token0Address = normalizeBackendNativeAddress({ chainId: pool.chainId, address: pool.token0.address })
  const token1Address = normalizeBackendNativeAddress({ chainId: pool.chainId, address: pool.token1.address })
  const stats = buildPoolSearchStats(rankedPool)

  return {
    type: SearchHistoryResultType.Pool,
    chainId: pool.chainId,
    poolId: pool.poolId,
    protocolVersion: pool.protocolVersion,
    hookAddress: pool.hookAddress,
    feeTier,
    token0CurrencyId: buildCurrencyId(pool.chainId, token0Address),
    token1CurrencyId: buildCurrencyId(pool.chainId, token1Address),
    ...(stats && { stats }),
  }
}
