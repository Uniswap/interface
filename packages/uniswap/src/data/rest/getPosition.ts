import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { getPosition } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { GetPositionRequest, GetPositionResponse } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'

export function useGetPositionQuery(
  input?: PartialMessage<GetPositionRequest>,
): UseQueryResult<GetPositionResponse, ConnectError> {
  return useQuery(getPosition, input, { transport: uniswapGetTransport, enabled: !!input })
}
