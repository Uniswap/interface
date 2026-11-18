import type { ConnectError } from '@connectrpc/connect'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { GetProtocolStatsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { UniverseChainId } from '@universe/chains'
import { getGetProtocolStatsQueryOptions } from '@universe/data-api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'

/** Every version Explore reports on. Request order is preserved in `protocolVersionStats`. */
export const EXPLORE_PROTOCOL_VERSIONS: ProtocolVersion[] = [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]

export interface UseGetProtocolStatsQueryParams {
  chainIds: UniverseChainId[]
  protocolVersions?: ProtocolVersion[]
  enabled?: boolean
}

export function useGetProtocolStatsQuery({
  chainIds,
  protocolVersions = EXPLORE_PROTOCOL_VERSIONS,
  enabled = true,
}: UseGetProtocolStatsQueryParams): UseQueryResult<GetProtocolStatsResponse, ConnectError> {
  return useQuery(getGetProtocolStatsQueryOptions(dataApiServiceClientV2, { chainIds, protocolVersions, enabled }))
}
