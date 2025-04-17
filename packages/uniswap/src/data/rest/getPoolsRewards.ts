import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { getRewards } from '@uniswap/client-pools/dist/pools/v1/api-PoolsService_connectquery'
import { GetRewardsRequest, GetRewardsResponse } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'

export function useGetPoolsRewards(
  input?: PartialMessage<GetRewardsRequest>,
  enabled = true,
): UseQueryResult<GetRewardsResponse, ConnectError> {
  return useQuery(getRewards, input, { transport: uniswapGetTransport, enabled })
}
