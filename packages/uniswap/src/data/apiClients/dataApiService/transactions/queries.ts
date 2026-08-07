import type { PartialMessage } from '@bufbuild/protobuf'
import { type InfiniteData, infiniteQueryOptions } from '@tanstack/react-query'
import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { ListTransactionsResponse, TransactionListFilter } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { TransactionEventType } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { InfiniteQueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export const DEFAULT_TRANSACTIONS_PAGE_SIZE = 25

export type ListTransactionsTokenScope = PartialMessage<TransactionListFilter>['tokenScope']

export interface ListTransactionsInput {
  chainIds: number[]
  /** Omitted = global feed (Explore). poolId = PDP, tokensOnChain/multichainId = TDP. */
  tokenScope?: ListTransactionsTokenScope
  /** Empty/omitted = all (swap + add + remove). */
  eventTypes?: TransactionEventType[]
  /** Empty/omitted = all (V2 + V3 + V4). */
  protocolVersions?: ProtocolVersion[]
  pageSize?: number
  enabled?: boolean
}

type ListTransactionsQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'listTransactions',
  number[],
  ListTransactionsTokenScope | undefined,
  TransactionEventType[] | undefined,
  ProtocolVersion[] | undefined,
  number,
]

/**
 * Query options for v2 ListTransactions (Substreams-backed protocol activity feed).
 * Deliberately not persisted to disk: rows are maximally volatile and cursor tokens go stale.
 */
export function getListTransactionsQueryOptions({
  chainIds,
  tokenScope,
  eventTypes,
  protocolVersions,
  pageSize = DEFAULT_TRANSACTIONS_PAGE_SIZE,
  enabled = true,
}: ListTransactionsInput): InfiniteQueryOptionsResult<
  ListTransactionsResponse,
  Error,
  InfiniteData<ListTransactionsResponse>,
  ListTransactionsQueryKey,
  string
> {
  return infiniteQueryOptions({
    queryKey: [
      ReactQueryCacheKey.DataApiService,
      'listTransactions',
      chainIds,
      tokenScope,
      eventTypes,
      protocolVersions,
      pageSize,
    ] as const,
    queryFn: ({ pageParam }) =>
      dataApiServiceClientV2.listTransactions({
        chainIds,
        filter: { protocolVersions, eventTypes, tokenScope },
        // BE rejects an explicit empty page_token as malformed — omit it on the first page.
        page: { pageSize, pageToken: pageParam || undefined },
      }),
    getNextPageParam: (lastPage: ListTransactionsResponse) => lastPage.page?.nextPageToken || undefined,
    initialPageParam: '',
    enabled,
  })
}
