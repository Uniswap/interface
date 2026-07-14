import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { protocolStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service-ExploreStatsService_connectquery'
import { ProtocolStatsRequest, ProtocolStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
// Repointed from uniswapGetTransport → dataApiGetTransport (HookSwap's self-hosted data-api at
// data.hookswap.org) so protocol TVL/volume stats come from a backend that indexes the custom chains
// (Robinhood 4663) — Uniswap's hosted ExploreStats does not. Mirrors the getPortfolio/listTransactions
// repoint precedent. The data-api serves ExploreStatsService.ProtocolStats and returns empty-but-valid
// for unsupported chains, so this is a transport swap, not a behavior regression.
import { dataApiGetTransport } from 'uniswap/src/data/rest/base'

/**
 * Wrapper around Tanstack useQuery for the Uniswap REST BE service ProtocolStats
 * This includes data for protocol TVL and volume graphs
 * @param input { chainId: string } - string representation of the chain to query or `ALL_NETWORKS` for aggregated data
 * @returns UseQueryResult<ProtocolStatsResponse, ConnectError>
 */
export function useProtocolStatsQuery(
  input?: PartialMessage<ProtocolStatsRequest>,
): UseQueryResult<ProtocolStatsResponse, ConnectError> {
  return useQuery(protocolStats, input, { transport: dataApiGetTransport })
}
