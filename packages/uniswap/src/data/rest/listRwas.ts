import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { listRwas } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import type { ListRwasResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/rest/base'

export function useListRwasQuery({
  chainIds,
  enabled = true,
}: {
  chainIds: number[]
  enabled?: boolean
}): UseQueryResult<ListRwasResponse, ConnectError> {
  return useQuery(
    listRwas,
    { chainIds },
    { transport: entryGatewayProdPostTransport, enabled: enabled && chainIds.length > 0 },
  )
}
