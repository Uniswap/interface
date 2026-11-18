import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { type InfiniteData } from '@tanstack/react-query'
import { type ListTransactionsRequest, ListTransactionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import {
  persistableInfiniteQueryOptions,
  persistableQueryOptions,
} from 'utilities/src/reactQuery/persistableQueryOptions'
import { type InfiniteQueryOptionsResult, type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { type DataApiServiceClient } from '../../clients/createDataApiServiceClient'
import {
  type AccountAddressesByPlatform,
  buildAccountAddressesByPlatform,
} from '../../utils/buildAccountAddressesByPlatform'
import { transformInput, type WithoutWalletAccount } from '../../utils/input'

/** Input used to build queryKey and queryFn. Config (enabled, refetchInterval, select) is applied by the caller. */
export type ListWalletTransactionsQueryParams = {
  input?: WithoutWalletAccount<PartialMessage<ListTransactionsRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
  /** Include chained-action plans in the feed. Part of the query key. */
  includePlans: boolean
}

type ListWalletTransactionsQueryKey = readonly [
  ReactQueryCacheKey.ListTransactions,
  AccountAddressesByPlatform | undefined,
  Record<string, unknown>,
]

type ListWalletTransactionsInfiniteQueryKey = readonly [
  ReactQueryCacheKey.ListTransactions,
  string | undefined,
  Record<string, unknown>,
  boolean,
]

const EMPTY_LIST_RESPONSE: PlainMessage<ListTransactionsResponse> = toPlainMessage(
  new ListTransactionsResponse({
    transactions: [],
    nextPageToken: undefined,
  }),
)

/**
 * Returns React Query options for DataApiService (v1) ListTransactions, a wallet's activity feed.
 * Callers should merge in config (enabled, refetchInterval, select) when building the final options.
 */
export function getListWalletTransactionsQueryOptions(
  client: DataApiServiceClient,
  { input, includePlans }: ListWalletTransactionsQueryParams,
): QueryOptionsResult<
  PlainMessage<ListTransactionsResponse> | undefined,
  Error,
  PlainMessage<ListTransactionsResponse> | undefined,
  ListWalletTransactionsQueryKey
> {
  const accountAddressesByPlatform = buildAccountAddressesByPlatform(input)
  const transformedInput = transformInput({
    ...input,
    includePlans,
    useSubstreamData: true,
  })

  const { walletAccount: _walletAccount, ...inputWithoutWalletAccount } = transformedInput ?? {}

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.ListTransactions, accountAddressesByPlatform, inputWithoutWalletAccount] as const,
    queryFn: async () =>
      transformedInput ? toPlainMessage(await client.listTransactions(transformedInput)) : undefined,
    placeholderData: (prev) => prev, // this prevents the loading skeleton from appearing when refetching
    staleTime: ONE_MINUTE_MS,
  })
}

/**
 * Infinite-scroll variant of {@link getListWalletTransactionsQueryOptions}.
 * Callers should merge in config (enabled, refetchInterval) when building the final options.
 */
export function getListWalletTransactionsInfiniteQueryOptions(
  client: DataApiServiceClient,
  { input, includePlans }: ListWalletTransactionsQueryParams,
): InfiniteQueryOptionsResult<
  PlainMessage<ListTransactionsResponse>,
  Error,
  InfiniteData<PlainMessage<ListTransactionsResponse>>,
  ListWalletTransactionsInfiniteQueryKey,
  string | undefined
> {
  const transformedInput = transformInput(input)

  const { walletAccount, ...inputWithoutAddress } = transformedInput ?? {}
  const address = walletAccount?.platformAddresses[0]?.address

  return persistableInfiniteQueryOptions({
    queryKey: [
      ReactQueryCacheKey.ListTransactions,
      address,
      inputWithoutAddress as Record<string, unknown>,
      includePlans,
    ] as const,
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      if (!transformedInput) {
        return EMPTY_LIST_RESPONSE
      }

      const requestWithPageToken = {
        ...transformedInput,
        pageToken: pageParam,
        includePlans,
        useSubstreamData: true,
      }

      return toPlainMessage(await client.listTransactions(requestWithPageToken))
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      return lastPage?.nextPageToken || undefined
    },
    placeholderData: (prev) => prev, // this prevents the loading skeleton from appearing when refetching
    staleTime: ONE_MINUTE_MS,
  })
}
