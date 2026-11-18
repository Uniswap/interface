import { PartialMessage, PlainMessage } from '@bufbuild/protobuf'
import { InfiniteData, queryOptions, UseInfiniteQueryResult, useInfiniteQuery } from '@tanstack/react-query'
import { ListTransactionsRequest, ListTransactionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  AccountAddressesByPlatform,
  getListWalletTransactionsInfiniteQueryOptions,
  getListWalletTransactionsQueryOptions,
  WithoutWalletAccount,
} from '@universe/data-api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { dataApiServiceClientV1 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

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
  readonly [ReactQueryCacheKey.ListTransactions, AccountAddressesByPlatform | undefined, Record<string, unknown>]
>

type GetListTransactionsInfiniteQuery = ReturnType<typeof getListWalletTransactionsInfiniteQueryOptions>

export const getListTransactionsInfiniteQuery = ({
  input,
  enabled,
  refetchInterval,
}: GetListTransactionsInfiniteInput): GetListTransactionsInfiniteQuery => {
  const baseOptions = getListWalletTransactionsInfiniteQueryOptions(dataApiServiceClientV1, {
    input,
    includePlans: getFeatureFlag(FeatureFlags.ChainedActions),
  })

  // `meta.persist: true` propagates from `baseOptions`.
  return {
    ...baseOptions,
    refetchInterval,
    enabled: !!input && enabled,
  }
}

export const getListTransactionsQuery = <TSelectData = ListTransactionsResponse>({
  input,
  enabled,
  refetchInterval,
  select,
}: GetListTransactionsInput<TSelectData>): GetListTransactionsQuery<TSelectData> => {
  const baseOptions = getListWalletTransactionsQueryOptions(dataApiServiceClientV1, {
    input,
    includePlans: getFeatureFlag(FeatureFlags.ChainedActions),
  })

  // `meta.persist: true` propagates from `baseOptions`.
  return queryOptions({
    ...baseOptions,
    refetchInterval,
    enabled: !!input && enabled,
    subscribed: !!enabled,
    select,
  })
}
