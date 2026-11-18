import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError, createPromiseClient } from '@connectrpc/connect'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { GetRewardsRequest, GetRewardsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { createDataApiServiceClient, getGetRewardsQueryOptions } from '@universe/data-api'
import { entryGatewayPostTransport } from 'uniswap/src/data/transport'

// Rewards read the current environment's gateway, unlike `dataApiServiceClientV1` which always reads prod.
const rewardsClient = createDataApiServiceClient({
  rpcClient: createPromiseClient(DataApiService, entryGatewayPostTransport),
})

export function useGetPoolsRewards(
  input?: PartialMessage<GetRewardsRequest>,
  enabled = true,
): UseQueryResult<GetRewardsResponse, ConnectError> {
  return useQuery(getGetRewardsQueryOptions(rewardsClient, { params: input, enabled }))
}
