import { PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import {
  InfiniteData,
  infiniteQueryOptions,
  queryOptions,
  UseInfiniteQueryResult,
  useInfiniteQuery,
} from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { ListTransactionsRequest, ListTransactionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { transformInput, WithoutWalletAccount } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { dataApiGetTransport } from 'uniswap/src/data/rest/base'
import {
  AccountAddressesByPlatform,
  buildAccountAddressesByPlatform,
} from 'uniswap/src/data/rest/buildAccountAddressesByPlatform'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { InfiniteQueryOptionsResult, QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

type GetListTransactionsInput<TSelectData = ListTransactionsResponse> = {
  input?: WithoutWalletAccount<PartialMessage<ListTransactionsRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
} & Pick<GetListTransactionsQuery<TSelectData>, 'enabled' | 'refetchInterval' | 'select'>

type GetListTransactionsInfiniteInput = {
  input?: WithoutWalletAccount<PartialMessage<ListTransactionsRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
  enabled?: boolean
  refetchInterval?: number
}

const transactionsClient = createPromiseClient(DataApiService, dataApiGetTransport)

const EMPTY_LIST_RESPONSE = new ListTransactionsResponse({
  transactions: [],
  nextPageToken: undefined,
})

/**
 * Wrapper around infinite query for DataApiService/ListTransactions
 * This fetches data for user transactions with infinite scrolling support
 */
export function useListTransactionsQuery(
  params: GetListTransactionsInfiniteInput,
): UseInfiniteQueryResult<InfiniteData<ListTransactionsResponse | undefined>, Error> {
  return useInfiniteQuery(getListTransactionsInfiniteQuery(params))
}

type GetListTransactionsQuery<TSelectData = ListTransactionsResponse> = QueryOptionsResult<
  ListTransactionsResponse | undefined,
  Error,
  TSelectData,
  readonly [
    ReactQueryCacheKey.ListTransactions,
    AccountAddressesByPlatform | undefined,
    PartialMessage<ListTransactionsRequest> | undefined,
  ]
>

type ListTransactionsInfiniteQueryKey = readonly [
  ReactQueryCacheKey.ListTransactions,
  string | undefined,
  Record<string, unknown>,
  boolean,
]

type GetListTransactionsInfiniteQuery = InfiniteQueryOptionsResult<
  ListTransactionsResponse,
  Error,
  InfiniteData<ListTransactionsResponse>,
  ListTransactionsInfiniteQueryKey,
  string | undefined
>

export const getListTransactionsInfiniteQuery = ({
  input,
  enabled,
  refetchInterval,
}: GetListTransactionsInfiniteInput): GetListTransactionsInfiniteQuery => {
  const transformedInput = transformInput(input)
  const includePlans = getFeatureFlag(FeatureFlags.ChainedActions)

  const { walletAccount, ...inputWithoutAddress } = transformedInput ?? {}
  const address = walletAccount?.platformAddresses[0]?.address

  return infiniteQueryOptions({
    queryKey: [
      ReactQueryCacheKey.ListTransactions,
      address,
      inputWithoutAddress as Record<string, unknown>,
      includePlans,
    ] as const,
    queryFn: ({ pageParam }: { pageParam?: string }) => {
      if (!transformedInput) {
        return Promise.resolve(EMPTY_LIST_RESPONSE)
      }

      const requestWithPageToken = {
        ...transformedInput,
        pageToken: pageParam,
        includePlans,
      }

      return transactionsClient.listTransactions(requestWithPageToken)
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return lastPage?.nextPageToken || undefined
    },
    placeholderData: (prev) => prev, // this prevents the loading skeleton from appearing when refetching
    refetchInterval,
    enabled: !!input && enabled,
  })
}

export const getListTransactionsQuery = <TSelectData = ListTransactionsResponse>({
  input,
  enabled,
  refetchInterval,
  select,
}: GetListTransactionsInput<TSelectData>): GetListTransactionsQuery<TSelectData> => {
  const accountAddressesByPlatform = buildAccountAddressesByPlatform(input)
  const includePlans = getFeatureFlag(FeatureFlags.ChainedActions)
  const transformedInput = transformInput({ ...input, includePlans })

  const { walletAccount: _walletAccount, ...inputWithoutWalletAccount } = transformedInput ?? {}

  return queryOptions({
    queryKey: [ReactQueryCacheKey.ListTransactions, accountAddressesByPlatform, inputWithoutWalletAccount],
    queryFn: () =>
      transformedInput ? transactionsClient.listTransactions(transformedInput) : Promise.resolve(undefined),
    placeholderData: (prev) => prev, // this prevents the loading skeleton from appearing when refetching
    refetchInterval,
    enabled: !!input && enabled,
    subscribed: !!enabled,
    select,
  })
}
