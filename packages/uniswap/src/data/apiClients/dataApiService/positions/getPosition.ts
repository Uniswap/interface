import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { getPosition } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { GetPositionRequest, GetPositionResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { uniswapPostTransport } from 'uniswap/src/data/transport'

/**
 * `permissioned` selects the V4 PermissionedPositionManager (tokenIds are only unique per manager);
 * the backend trusts the flag with no fallback, so a wrong value reads as not-minted.
 */
export type GetPositionInput = PartialMessage<GetPositionRequest>

export function useGetPositionQuery(input?: GetPositionInput): UseQueryResult<GetPositionResponse, ConnectError> {
  return useQuery(getPosition, input, { transport: uniswapPostTransport, enabled: !!input })
}
