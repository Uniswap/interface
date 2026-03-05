import { infiniteQueryOptions } from '@tanstack/react-query'
import type { ListTopPoolsResponse, ListTopTokensResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  getListTopPoolsQueryOptions,
  type ListTopPoolsInput,
} from 'uniswap/src/data/apiClients/dataApiService/listTopPools'
import {
  getListTopTokensQueryOptions,
  type ListTopTokensInput,
} from 'uniswap/src/data/apiClients/dataApiService/listTopTokens'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

type ListTopTokensQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'listTopTokens', ListTopTokensInput['params']]
type ListTopPoolsQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'listTopPools', ListTopPoolsInput['params']]

export const dataApiQueries: {
  listTopTokens: (
    input: ListTopTokensInput,
  ) => ReturnType<
    typeof infiniteQueryOptions<ListTopTokensResponse, Error, ListTopTokensResponse, ListTopTokensQueryKey, string>
  >
  listTopPools: (
    input: ListTopPoolsInput,
  ) => ReturnType<
    typeof infiniteQueryOptions<ListTopPoolsResponse, Error, ListTopPoolsResponse, ListTopPoolsQueryKey, string>
  >
} = {
  listTopTokens: (input) => getListTopTokensQueryOptions(input),
  listTopPools: (input) => getListTopPoolsQueryOptions(input),
}
