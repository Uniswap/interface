import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { GetPositionRequest, GetPositionResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getPosition } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { uniswapPostTransport } from 'uniswap/src/data/rest/base'

export function useGetPositionQuery(
  input?: PartialMessage<GetPositionRequest>,
): UseQueryResult<GetPositionResponse, ConnectError> {
  return useQuery(getPosition, input, { transport: uniswapPostTransport, enabled: !!input })
}
