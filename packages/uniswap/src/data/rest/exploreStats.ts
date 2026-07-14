import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { exploreStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service-ExploreStatsService_connectquery'
import { ExploreStatsRequest, ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
// Repointed from uniswapGetTransport → dataApiGetTransport (HookSwap's self-hosted data-api at
// data.hookswap.org) so explore stats come from a backend that indexes the custom chains (Robinhood
// 4663) — Uniswap's hosted ExploreStats does not. Mirrors the getPortfolio/listTransactions repoint
// precedent. The data-api serves ExploreStatsService.ExploreStats and returns empty-but-valid for
// unsupported chains, so this is a transport swap, not a behavior regression.
import { dataApiGetTransport } from 'uniswap/src/data/rest/base'

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
  return useQuery(exploreStats, input, { transport: dataApiGetTransport, enabled, select })
}
