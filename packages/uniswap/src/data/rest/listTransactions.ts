import { PartialMessage, PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { InfiniteData, UseInfiniteQueryResult, useInfiniteQuery } from '@tanstack/react-query'
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
import {
  persistableInfiniteQueryOptions,
  persistableQueryOptions,
} from 'utilities/src/reactQuery/persistableQueryOptions'
import type { InfiniteQueryOptionsResult, QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

type GetListTransactionsInput<TSelectData = PlainMessage<ListTransactionsResponse>> = {
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

const EMPTY_LIST_RESPONSE: PlainMessage<ListTransactionsResponse> = toPlainMessage(
  new ListTransactionsResponse({
    transactions: [],
    nextPageToken: undefined,
  }),
)

/**
 * Wrapper around infinite query for DataApiService/ListTransactions
 * This fetches data for user transactions with infinite scrolling support
 */
export function useListTransactionsQuery(
  params: GetListTransactionsInfiniteInput,
): UseInfiniteQueryResult<InfiniteData<PlainMessage<ListTransactionsResponse> | undefined>, Error> {
  return useInfiniteQuery(getListTransactionsInfiniteQuery(params))
}

type GetListTransactionsQuery<TSelectData = PlainMessage<ListTransactionsResponse>> = QueryOptionsResult<
  PlainMessage<ListTransactionsResponse> | undefined,
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
  boolean,
]

type GetListTransactionsInfiniteQuery = InfiniteQueryOptionsResult<
  PlainMessage<ListTransactionsResponse>,
  Error,
  InfiniteData<PlainMessage<ListTransactionsResponse>>,
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
  const isV2TokensEnabled = getFeatureFlag(FeatureFlags.V2EndpointsTokens)

  const { walletAccount, ...inputWithoutAddress } = transformedInput ?? {}
  const address = walletAccount?.platformAddresses[0]?.address

  return persistableInfiniteQueryOptions({
    queryKey: [
      ReactQueryCacheKey.ListTransactions,
      address,
      inputWithoutAddress as Record<string, unknown>,
      includePlans,
      isV2TokensEnabled,
    ] as const,
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      if (!transformedInput) {
        return EMPTY_LIST_RESPONSE
      }

      const requestWithPageToken = {
        ...transformedInput,
        pageToken: pageParam,
        includePlans,
        ...(isV2TokensEnabled && { useSubstreamData: true }),
      }

      return toPlainMessage(await transactionsClient.listTransactions(requestWithPageToken))
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // oxlint-disable-next-line typescript/no-unnecessary-condition
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
  const isV2TokensEnabled = getFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const transformedInput = transformInput({
    ...input,
    includePlans,
    ...(isV2TokensEnabled && { useSubstreamData: true }),
  })

  const { walletAccount: _walletAccount, ...inputWithoutWalletAccount } = transformedInput ?? {}

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.ListTransactions, accountAddressesByPlatform, inputWithoutWalletAccount],
    queryFn: async () =>
      transformedInput ? toPlainMessage(await transactionsClient.listTransactions(transformedInput)) : undefined,
    placeholderData: (prev) => prev, // this prevents the loading skeleton from appearing when refetching
    refetchInterval,
    enabled: !!input && enabled,
    subscribed: !!enabled,
    select,
  })
}
