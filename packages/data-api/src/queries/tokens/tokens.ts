import { type Message, type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { Code, ConnectError } from '@connectrpc/connect'
import { keepPreviousData } from '@tanstack/react-query'
import {
  type GetTokenBuySellStatsRequest,
  type GetTokenBuySellStatsResponse,
  type GetTokenHistoryOHLCRequest,
  type GetTokenHistoryOHLCResponse,
  type GetTokenHistoryPriceRequest,
  type GetTokenHistoryPriceResponse,
  type GetTokenHistoryTVLRequest,
  type GetTokenHistoryTVLResponse,
  type GetTokenHistoryVolumeRequest,
  type GetTokenHistoryVolumeResponse,
  type GetTokenMarketsMultiChainRequest,
  type GetTokenMarketsMultiChainResponse,
  type GetTokenMarketsRequest,
  type GetTokenMarketsResponse,
  type GetTokenMultiChainRequest,
  type GetTokenMultiChainResponse,
  type GetTokenRequest,
  type GetTokenResponse,
  type GetTokensMultiChainRequest,
  type GetTokensMultiChainResponse,
  type GetTokensRequest,
  type GetTokensResponse,
  type ListTokensRequest,
  type ListTokensResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { type DataApiServiceClientV2 } from '../../clients/createDataApiServiceClientV2'

type DataApiV2Input<TRequest extends Message<TRequest>, TResponse extends Message<TResponse>, TSelectData> = {
  params?: PartialMessage<TRequest>
  enabled?: boolean
  /**
   * Serve the previous key's data while a new key loads (react-query `keepPreviousData`). Turn off
   * where a key change is a different view, e.g. a chart period switch that should show its skeleton.
   */
  keepPreviousData?: boolean
  select?: (data: PlainMessage<TResponse> | undefined) => TSelectData
}

type DataApiV2QueryKey<TName extends string, TRequest extends Message<TRequest>> = readonly [
  ReactQueryCacheKey.DataApiService,
  TName,
  PartialMessage<TRequest> | undefined,
]

export type GetTokenInput<TSelectData = PlainMessage<GetTokenResponse>> = DataApiV2Input<
  GetTokenRequest,
  GetTokenResponse,
  TSelectData
>

export type GetTokensInput<TSelectData = PlainMessage<GetTokensResponse>> = DataApiV2Input<
  GetTokensRequest,
  GetTokensResponse,
  TSelectData
>

export type GetTokenMultiChainInput<TSelectData = PlainMessage<GetTokenMultiChainResponse>> = DataApiV2Input<
  GetTokenMultiChainRequest,
  GetTokenMultiChainResponse,
  TSelectData
>

export type GetTokensMultiChainInput<TSelectData = PlainMessage<GetTokensMultiChainResponse>> = DataApiV2Input<
  GetTokensMultiChainRequest,
  GetTokensMultiChainResponse,
  TSelectData
>

export type GetTokenMarketsInput<TSelectData = PlainMessage<GetTokenMarketsResponse>> = DataApiV2Input<
  GetTokenMarketsRequest,
  GetTokenMarketsResponse,
  TSelectData
>

export type GetTokenMarketsMultiChainInput<TSelectData = PlainMessage<GetTokenMarketsMultiChainResponse>> =
  DataApiV2Input<GetTokenMarketsMultiChainRequest, GetTokenMarketsMultiChainResponse, TSelectData>

export type GetTokenHistoryPriceInput<TSelectData = PlainMessage<GetTokenHistoryPriceResponse>> = DataApiV2Input<
  GetTokenHistoryPriceRequest,
  GetTokenHistoryPriceResponse,
  TSelectData
>

export type GetTokenHistoryOHLCInput<TSelectData = PlainMessage<GetTokenHistoryOHLCResponse>> = DataApiV2Input<
  GetTokenHistoryOHLCRequest,
  GetTokenHistoryOHLCResponse,
  TSelectData
>

export type GetTokenHistoryVolumeInput<TSelectData = PlainMessage<GetTokenHistoryVolumeResponse>> = DataApiV2Input<
  GetTokenHistoryVolumeRequest,
  GetTokenHistoryVolumeResponse,
  TSelectData
>

export type GetTokenHistoryTVLInput<TSelectData = PlainMessage<GetTokenHistoryTVLResponse>> = DataApiV2Input<
  GetTokenHistoryTVLRequest,
  GetTokenHistoryTVLResponse,
  TSelectData
>

export type GetTokenBuySellStatsInput<TSelectData = PlainMessage<GetTokenBuySellStatsResponse>> = DataApiV2Input<
  GetTokenBuySellStatsRequest,
  GetTokenBuySellStatsResponse,
  TSelectData
>

export type ListTokensInput<TSelectData = PlainMessage<ListTokensResponse>> = DataApiV2Input<
  ListTokensRequest,
  ListTokensResponse,
  TSelectData
>

type GetQueryOptionsPolicy = {
  refetchInterval?: number
  staleTime?: number
}

// Builds a `getXQueryOptions` function for a non-paginated DataApiServiceV2 endpoint. All such
// endpoints share the same shape: params required to run, keepPreviousData while refetching (callers
// can opt out), and a query key of [DataApiService, name, params]. `policy` lets each endpoint opt
// into its own refetchInterval/staleTime — there's no shared default since freshness needs differ
// per endpoint.
function createGetQueryOptions<
  TName extends string,
  TRequest extends Message<TRequest>,
  TResponse extends Message<TResponse>,
>({
  name,
  fetch,
  policy,
}: {
  name: TName
  fetch: (client: DataApiServiceClientV2, params: PartialMessage<TRequest>) => Promise<TResponse>
  policy?: GetQueryOptionsPolicy
}) {
  return function getQueryOptions<TSelectData = PlainMessage<TResponse>>(
    client: DataApiServiceClientV2,
    {
      params,
      enabled = true,
      keepPreviousData: keepPrevious = true,
      select,
    }: DataApiV2Input<TRequest, TResponse, TSelectData>,
  ): QueryOptionsResult<PlainMessage<TResponse> | undefined, Error, TSelectData, DataApiV2QueryKey<TName, TRequest>> {
    return persistableQueryOptions({
      queryKey: [ReactQueryCacheKey.DataApiService, name, params] as const,
      queryFn: async (): Promise<PlainMessage<TResponse> | undefined> => {
        if (!params) {
          return undefined
        }
        return toPlainMessage(await fetch(client, params))
      },
      enabled: enabled && !!params,
      placeholderData: keepPrevious ? keepPreviousData : undefined,
      select,
      ...policy,
    })
  }
}

// Price-bearing queries stay fresh at the 30s poll cadence; list/stats/history data holds for a minute.
const PRICE_STALE_TIME_MS = 30 * ONE_SECOND_MS
const STATS_STALE_TIME_MS = ONE_MINUTE_MS

export const getGetTokenQueryOptions = createGetQueryOptions({
  name: 'getToken',
  fetch: (client, params: PartialMessage<GetTokenRequest>) => client.getToken(params),
  policy: { staleTime: PRICE_STALE_TIME_MS },
})

export const getGetTokensQueryOptions = createGetQueryOptions({
  name: 'getTokens',
  fetch: (client, params: PartialMessage<GetTokensRequest>) => client.getTokens(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

export const getGetTokenMultiChainQueryOptions = createGetQueryOptions({
  name: 'getTokenMultiChain',
  // No single-chain fallback needed: the backend serves tokens outside the multichain index as a
  // single-entry response itself, so a NotFound here means the token is unknown to it entirely.
  fetch: (client, params: PartialMessage<GetTokenMultiChainRequest>) => client.getTokenMultiChain(params),
  policy: { staleTime: PRICE_STALE_TIME_MS },
})

export const getGetTokensMultiChainQueryOptions = createGetQueryOptions({
  name: 'getTokensMultiChain',
  fetch: (client, params: PartialMessage<GetTokensMultiChainRequest>) => client.getTokensMultiChain(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

export const getGetTokenMarketsQueryOptions = createGetQueryOptions({
  name: 'getTokenMarkets',
  fetch: (client, params: PartialMessage<GetTokenMarketsRequest>) => client.getTokenMarkets(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

/**
 * A chain id the data API doesn't recognize in `chainIds` fails the whole request
 * (invalid_argument, "Unrecognized chainId: ..."), which would blank market stats on every
 * multichain TDP if a chain ever ships app-side before data-api onboarding. Fall back to the
 * unfiltered aggregate: over-inclusive for the unknown chain beats no stats at all. If the
 * backend's error shape changes, the fallback stops firing and behavior is unchanged.
 */
async function fetchTokenMarketsMultiChainWithChainIdFallback(
  client: DataApiServiceClientV2,
  params: PartialMessage<GetTokenMarketsMultiChainRequest>,
): Promise<GetTokenMarketsMultiChainResponse> {
  try {
    return await client.getTokenMarketsMultiChain(params)
  } catch (error) {
    const isUnrecognizedChainId =
      error instanceof ConnectError && error.code === Code.InvalidArgument && error.rawMessage.includes('chainId')
    if (isUnrecognizedChainId && params.chainIds?.length) {
      logger.error(error, {
        tags: { file: 'tokens.ts', function: 'fetchTokenMarketsMultiChainWithChainIdFallback' },
        extra: { chainIds: params.chainIds },
      })
      return client.getTokenMarketsMultiChain({ ...params, chainIds: undefined })
    }
    throw error
  }
}

export const getGetTokenMarketsMultiChainQueryOptions = createGetQueryOptions({
  name: 'getTokenMarketsMultiChain',
  fetch: fetchTokenMarketsMultiChainWithChainIdFallback,
  policy: { staleTime: STATS_STALE_TIME_MS },
})

export const getGetTokenHistoryPriceQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryPrice',
  fetch: (client, params: PartialMessage<GetTokenHistoryPriceRequest>) => client.getTokenHistoryPrice(params),
  // Refetched on the TDP 30s price tick alongside getTokenMultiChain, not the config-cadence full tick.
  policy: { staleTime: PRICE_STALE_TIME_MS },
})

export const getGetTokenHistoryOHLCQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryOHLC',
  fetch: (client, params: PartialMessage<GetTokenHistoryOHLCRequest>) => client.getTokenHistoryOHLC(params),
  // Refetched on the TDP 30s price tick alongside getTokenMultiChain, not the config-cadence full tick.
  policy: { staleTime: PRICE_STALE_TIME_MS },
})

export const getGetTokenHistoryVolumeQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryVolume',
  fetch: (client, params: PartialMessage<GetTokenHistoryVolumeRequest>) => client.getTokenHistoryVolume(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

export const getGetTokenHistoryTVLQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryTVL',
  fetch: (client, params: PartialMessage<GetTokenHistoryTVLRequest>) => client.getTokenHistoryTVL(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

export const getGetTokenBuySellStatsQueryOptions = createGetQueryOptions({
  name: 'getTokenBuySellStats',
  fetch: (client, params: PartialMessage<GetTokenBuySellStatsRequest>) => client.getTokenBuySellStats(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

/**
 * Single page of ListTokens for callers that only want the top `params.page.pageSize` rows (a
 * "trending tokens" shelf, for instance) and never page further. Explore-style tables that page
 * forward use `useExploreListTokens` instead.
 */
export const getListTokensQueryOptions = createGetQueryOptions({
  name: 'listTokens',
  fetch: (client, params: PartialMessage<ListTokensRequest>) => client.listTokens(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})
