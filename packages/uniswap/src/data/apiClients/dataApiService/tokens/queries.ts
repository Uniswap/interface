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
  GetTokenRequest,
  GetTokenResponse,
  GetTokensMultiChainRequest,
  GetTokensMultiChainResponse,
  GetTokensRequest,
  GetTokensResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApi/DataApiClientV2'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

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

export const getGetTokenQueryOptions = createGetQueryOptions({
  name: 'getToken',
  fetch: (params: PartialMessage<GetTokenRequest>) => dataApiServiceClientV2.getToken(params),
})

export const getGetTokensQueryOptions = createGetQueryOptions({
  name: 'getTokens',
  fetch: (params: PartialMessage<GetTokensRequest>) => dataApiServiceClientV2.getTokens(params),
})

export const getGetTokensMultiChainQueryOptions = createGetQueryOptions({
  name: 'getTokensMultiChain',
  fetch: (params: PartialMessage<GetTokensMultiChainRequest>) => dataApiServiceClientV2.getTokensMultiChain(params),
})

export const getGetTokenMarketsQueryOptions = createGetQueryOptions({
  name: 'getTokenMarkets',
  fetch: (params: PartialMessage<GetTokenMarketsRequest>) => dataApiServiceClientV2.getTokenMarkets(params),
})

export const getGetTokenMarketsMultiChainQueryOptions = createGetQueryOptions({
  name: 'getTokenMarketsMultiChain',
  fetch: (params: PartialMessage<GetTokenMarketsMultiChainRequest>) =>
    dataApiServiceClientV2.getTokenMarketsMultiChain(params),
})

export const getGetTokenHistoryPriceQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryPrice',
  fetch: (params: PartialMessage<GetTokenHistoryPriceRequest>) => dataApiServiceClientV2.getTokenHistoryPrice(params),
})

export const getGetTokenHistoryOHLCQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryOHLC',
  fetch: (params: PartialMessage<GetTokenHistoryOHLCRequest>) => dataApiServiceClientV2.getTokenHistoryOHLC(params),
})

export const getGetTokenHistoryVolumeQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryVolume',
  fetch: (params: PartialMessage<GetTokenHistoryVolumeRequest>) => dataApiServiceClientV2.getTokenHistoryVolume(params),
})

export const getGetTokenHistoryTVLQueryOptions = createGetQueryOptions({
  name: 'getTokenHistoryTVL',
  fetch: (params: PartialMessage<GetTokenHistoryTVLRequest>) => dataApiServiceClientV2.getTokenHistoryTVL(params),
})
