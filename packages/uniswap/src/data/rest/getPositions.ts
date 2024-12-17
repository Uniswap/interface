/* eslint-disable no-restricted-imports */
import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult, keepPreviousData } from '@tanstack/react-query'
import { listPositions } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { ListPositionsRequest, ListPositionsResponse } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'

export function useGetPositionsQuery(
  input?: PartialMessage<ListPositionsRequest>,
  disabled?: boolean,
): UseQueryResult<ListPositionsResponse, ConnectError> {
  return useQuery(listPositions, input, {
    transport: uniswapGetTransport,
    enabled: !!input && !disabled,
    placeholderData: keepPreviousData,
  })
}
