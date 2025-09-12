import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { ExploreStatsRequest, ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { exploreStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service-ExploreStatsService_connectquery'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'

/**
 * Wrapper around Tanstack useQuery for the Uniswap REST BE service ExploreStats
 * This included top tokens and top pools data
 * @param input { chainId: string } - string representation of the chain to query or `ALL_NETWORKS` for aggregated data
 * @param select - function to transform the data before returning it
 * @returns UseQueryResult<ExploreStatsResponse, ConnectError>
 */
export function useExploreStatsQuery<TSelectType>({
  input,
  enabled = true,
  select,
}: {
  input?: PartialMessage<ExploreStatsRequest>
  enabled?: boolean
  select?: ((data: ExploreStatsResponse) => TSelectType) | undefined
}): UseQueryResult<TSelectType, ConnectError> {
  return useQuery(exploreStats, input, { transport: uniswapGetTransport, enabled, select })
}
