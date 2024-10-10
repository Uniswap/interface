/* eslint-disable no-restricted-imports */
import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { listPools } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { ListPoolsRequest, ListPoolsResponse } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { getPositionsTestTransport } from 'uniswap/src/data/rest/getPositions'

export function useGetPoolsByTokens(
  input?: PartialMessage<ListPoolsRequest>,
  enabled = true,
): UseQueryResult<ListPoolsResponse, ConnectError> {
  return useQuery(listPools, input, { transport: getPositionsTestTransport, enabled })
}
