import { type PartialMessage } from '@bufbuild/protobuf'
import { type ConnectError } from '@connectrpc/connect'
import { queryOptions } from '@tanstack/react-query'
import type { GetRewardsRequest, GetRewardsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { type DataApiServiceClient } from '../../clients/createDataApiServiceClient'

export type GetRewardsInput = {
  params?: PartialMessage<GetRewardsRequest>
  enabled?: boolean
}

type GetRewardsQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'getRewards',
  PartialMessage<GetRewardsRequest> | undefined,
]

/** LP incentive rewards for a wallet. */
export function getGetRewardsQueryOptions(
  client: DataApiServiceClient,
  { params, enabled = true }: GetRewardsInput,
): QueryOptionsResult<GetRewardsResponse, ConnectError, GetRewardsResponse, GetRewardsQueryKey> {
  return queryOptions<GetRewardsResponse, ConnectError, GetRewardsResponse, GetRewardsQueryKey>({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getRewards', params] as const,
    queryFn: () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.getRewards(params)
    },
    enabled: enabled && !!params,
  })
}
