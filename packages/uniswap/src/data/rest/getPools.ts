import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { ListPoolsRequest, ListPoolsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { listPools } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'

export function useGetPoolsByTokens(
  input: PartialMessage<ListPoolsRequest>,
  enabled: boolean,
): UseQueryResult<ListPoolsResponse, ConnectError> {
  return useQuery(listPools, input, { transport: uniswapGetTransport, enabled })
}
