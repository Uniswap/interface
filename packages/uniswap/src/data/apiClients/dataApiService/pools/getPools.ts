import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { getPool, listPools } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import {
  GetPoolRequest,
  GetPoolResponse,
  ListPoolsRequest,
  ListPoolsResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { uniswapGetTransport } from 'uniswap/src/data/transport'

export function useGetPoolsByTokens(
  input: PartialMessage<ListPoolsRequest>,
  enabled: boolean,
): UseQueryResult<ListPoolsResponse, ConnectError> {
  return useQuery(listPools, input, { transport: uniswapGetTransport, enabled })
}

export function useGetPool(
  input: PartialMessage<GetPoolRequest>,
  enabled: boolean,
): UseQueryResult<GetPoolResponse, ConnectError> {
  return useQuery(getPool, input, { transport: uniswapGetTransport, enabled })
}
