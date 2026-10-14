import type { ConnectError } from '@connectrpc/connect'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { GetProtocolStatsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { UniverseChainId } from '@universe/chains'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

/** Query-key prefix shared with the Explore heartbeat so it can refetch this query without knowing its inputs. */
export const GET_PROTOCOL_STATS_QUERY_KEY_PREFIX = [ReactQueryCacheKey.DataApiService, 'getProtocolStats'] as const

/** Every version Explore reports on. Request order is preserved in `protocolVersionStats`. */
export const EXPLORE_PROTOCOL_VERSIONS: ProtocolVersion[] = [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]

export interface UseGetProtocolStatsQueryParams {
  chainIds: UniverseChainId[]
  protocolVersions?: ProtocolVersion[]
  enabled?: boolean
}

/**
 * v2 GetProtocolStats: protocol TVL and trailing-1D volume with server-computed 1D % changes,
 * both as a total and per protocol version. The BE rejects an empty chain set, so the query
 * stays idle until at least one chain is known.
 */
export function useGetProtocolStatsQuery({
  chainIds,
  protocolVersions = EXPLORE_PROTOCOL_VERSIONS,
  enabled = true,
}: UseGetProtocolStatsQueryParams): UseQueryResult<GetProtocolStatsResponse, ConnectError> {
  return useQuery({
    queryKey: [...GET_PROTOCOL_STATS_QUERY_KEY_PREFIX, chainIds, protocolVersions],
    queryFn: () =>
      dataApiServiceClientV2.getProtocolStats({
        chainIds: chainIds.map((chainId): number => chainId),
        protocolVersions,
      }),
    staleTime: ONE_MINUTE_MS,
    // The global retry policy only covers FetchError 500s, which a ConnectRPC error never is.
    retry: 2,
    enabled: enabled && chainIds.length > 0,
  })
}
