import { type Message, type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { keepPreviousData } from '@tanstack/react-query'
import type {
  GetTokenHistoryOHLCRequest,
  GetTokenHistoryOHLCResponse,
  GetTokenHistoryPriceRequest,
  GetTokenHistoryPriceResponse,
  GetTokenHistoryTVLRequest,
  GetTokenHistoryTVLResponse,
  GetTokenHistoryVolumeRequest,
  GetTokenHistoryVolumeResponse,
  GetTokenMarketsMultiChainRequest,
  GetTokenMarketsMultiChainResponse,
  GetTokenMarketsRequest,
  GetTokenMarketsResponse,
  GetTokenMultiChainRequest,
  GetTokenMultiChainResponse,
  GetTokenRequest,
  GetTokenResponse,
  GetTokensMultiChainRequest,
  GetTokensMultiChainResponse,
  GetTokensRequest,
  GetTokensResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

type DataApiV2Input<TRequest extends Message<TRequest>, TResponse extends Message<TResponse>, TSelectData> = {
  params?: PartialMessage<TRequest>
  enabled?: boolean
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

type GetQueryOptionsPolicy = {
  refetchInterval?: number
  staleTime?: number
}

// Builds a `getXQueryOptions` function for a non-paginated DataApiServiceV2 endpoint. All such
// endpoints share the same shape: params required to run, keepPreviousData while refetching,
// and a query key of [DataApiService, name, params]. `policy` lets each endpoint opt into its own
// refetchInterval/staleTime — there's no shared default since freshness needs differ per endpoint.
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
  fetch: (params: PartialMessage<TRequest>) => Promise<TResponse>
  policy?: GetQueryOptionsPolicy
}) {
  return function getQueryOptions<TSelectData = PlainMessage<TResponse>>({
    params,
    enabled = true,
    select,
  }: DataApiV2Input<TRequest, TResponse, TSelectData>): QueryOptionsResult<
    PlainMessage<TResponse> | undefined,
    Error,
    TSelectData,
    DataApiV2QueryKey<TName, TRequest>
  > {
    return persistableQueryOptions({
      queryKey: [ReactQueryCacheKey.DataApiService, name, params] as const,
      queryFn: async (): Promise<PlainMessage<TResponse> | undefined> => {
        if (!params) {
          return undefined
        }
        return toPlainMessage(await fetch(params))
      },
      enabled: enabled && !!params,
      placeholderData: keepPreviousData,
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
  fetch: (params: PartialMessage<GetTokenRequest>) => dataApiServiceClientV2.getToken(params),
  policy: { staleTime: PRICE_STALE_TIME_MS },
})

export const getGetTokensQueryOptions = createGetQueryOptions({
  name: 'getTokens',
  fetch: (params: PartialMessage<GetTokensRequest>) => dataApiServiceClientV2.getTokens(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

export const getGetTokenMultiChainQueryOptions = createGetQueryOptions({
  name: 'getTokenMultiChain',
  fetch: (params: PartialMessage<GetTokenMultiChainRequest>) => dataApiServiceClientV2.getTokenMultiChain(params),
  policy: { staleTime: PRICE_STALE_TIME_MS },
})

export const getGetTokensMultiChainQueryOptions = createGetQueryOptions({
  name: 'getTokensMultiChain',
  fetch: (params: PartialMessage<GetTokensMultiChainRequest>) => dataApiServiceClientV2.getTokensMultiChain(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

export const getGetTokenMarketsQueryOptions = createGetQueryOptions({
  name: 'getTokenMarkets',
  fetch: (params: PartialMessage<GetTokenMarketsRequest>) => dataApiServiceClientV2.getTokenMarkets(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

export const getGetTokenMarketsMultiChainQueryOptions = createGetQueryOptions({
  name: 'getTokenMarketsMultiChain',
  fetch: (params: PartialMessage<GetTokenMarketsMultiChainRequest>) =>
    dataApiServiceClientV2.getTokenMarketsMultiChain(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

export const getGetTokenHistoryPriceQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryPrice',
  fetch: (params: PartialMessage<GetTokenHistoryPriceRequest>) => dataApiServiceClientV2.getTokenHistoryPrice(params),
  // Refetched on the TDP 30s price tick alongside getToken/getTokenMultiChain, not the config-cadence full tick.
  policy: { staleTime: PRICE_STALE_TIME_MS },
})

export const getGetTokenHistoryOHLCQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryOHLC',
  fetch: (params: PartialMessage<GetTokenHistoryOHLCRequest>) => dataApiServiceClientV2.getTokenHistoryOHLC(params),
  // Refetched on the TDP 30s price tick alongside getToken/getTokenMultiChain, not the config-cadence full tick.
  policy: { staleTime: PRICE_STALE_TIME_MS },
})

export const getGetTokenHistoryVolumeQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryVolume',
  fetch: (params: PartialMessage<GetTokenHistoryVolumeRequest>) => dataApiServiceClientV2.getTokenHistoryVolume(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})

export const getGetTokenHistoryTVLQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryTVL',
  fetch: (params: PartialMessage<GetTokenHistoryTVLRequest>) => dataApiServiceClientV2.getTokenHistoryTVL(params),
  policy: { staleTime: STATS_STALE_TIME_MS },
})
