import { type InfiniteData, infiniteQueryOptions } from '@tanstack/react-query'
import type { ListTokensResponse, ListTopPoolsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getListTokensQueryOptions, type ListTokensInput } from 'uniswap/src/data/apiClients/dataApiService/listTokens'
import {
  getListTopPoolsQueryOptions,
  type ListTopPoolsInput,
} from 'uniswap/src/data/apiClients/dataApiService/listTopPools'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

type ListTokensQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'listTokens', ListTokensInput['params']]
type ListTopPoolsQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'listTopPools', ListTopPoolsInput['params']]

export const dataApiQueries: {
  listTokens: (
    input: ListTokensInput,
  ) => ReturnType<
    typeof infiniteQueryOptions<
      ListTokensResponse,
      Error,
      InfiniteData<ListTokensResponse, string>,
      ListTokensQueryKey,
      string
    >
  >
  listTopPools: (
    input: ListTopPoolsInput,
  ) => ReturnType<
    typeof infiniteQueryOptions<ListTopPoolsResponse, Error, ListTopPoolsResponse, ListTopPoolsQueryKey, string>
  >
} = {
  listTokens: (input) => getListTokensQueryOptions(input),
  listTopPools: (input) => getListTopPoolsQueryOptions(input),
}
