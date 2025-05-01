import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { listPools } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { ListPoolsRequest, ListPoolsResponse } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'

export function useGetPoolsByTokens(
  input?: PartialMessage<ListPoolsRequest>,
  enabled = true,
): UseQueryResult<ListPoolsResponse, ConnectError> {
  return {
    ...useQuery(listPools, input, { transport: uniswapGetTransport, enabled }),
    data: { pools: [] },
    isLoading: false,
    isLoadingError: false,
    error: null,
  }
}
