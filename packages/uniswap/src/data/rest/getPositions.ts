/* eslint-disable no-restricted-imports */
import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { createConnectTransport } from '@connectrpc/connect-web'
import { UseQueryResult } from '@tanstack/react-query'
import { listPositions } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { ListPositionsRequest, ListPositionsResponse } from '@uniswap/client-pools/dist/pools/v1/api_pb'

export const getPositionsTestTransport = createConnectTransport({
  baseUrl: 'https://9bxqhlmige.execute-api.us-east-2.amazonaws.com', // TODO: replace with the prod url and update in csp.json as well
})

export function useGetPositionsQuery(
  input?: PartialMessage<ListPositionsRequest>,
  disabled?: boolean,
): UseQueryResult<ListPositionsResponse, ConnectError> {
  return useQuery(listPositions, input, { transport: getPositionsTestTransport, enabled: !!input && !disabled })
}
