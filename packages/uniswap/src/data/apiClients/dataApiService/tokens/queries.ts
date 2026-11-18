import { type PlainMessage } from '@bufbuild/protobuf'
import type {
  GetTokenBuySellStatsResponse,
  GetTokenHistoryOHLCResponse,
  GetTokenHistoryPriceResponse,
  GetTokenHistoryTVLResponse,
  GetTokenHistoryVolumeResponse,
  GetTokenMarketsMultiChainResponse,
  GetTokenMarketsResponse,
  GetTokenMultiChainResponse,
  GetTokenResponse,
  GetTokensMultiChainResponse,
  GetTokensResponse,
  ListTokensResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { UniverseChainId } from '@universe/chains'
import {
  getGetTokenBuySellStatsQueryOptions as getGetTokenBuySellStatsQueryOptionsWithClient,
  getGetTokenHistoryOHLCQueryOptions as getGetTokenHistoryOHLCQueryOptionsWithClient,
  getGetTokenHistoryPriceQueryOptions as getGetTokenHistoryPriceQueryOptionsWithClient,
  getGetTokenHistoryTVLQueryOptions as getGetTokenHistoryTVLQueryOptionsWithClient,
  getGetTokenHistoryVolumeQueryOptions as getGetTokenHistoryVolumeQueryOptionsWithClient,
  getGetTokenMarketsMultiChainQueryOptions as getGetTokenMarketsMultiChainQueryOptionsWithClient,
  getGetTokenMarketsQueryOptions as getGetTokenMarketsQueryOptionsWithClient,
  getGetTokenMultiChainQueryOptions as getGetTokenMultiChainQueryOptionsWithClient,
  getGetTokenQueryOptions as getGetTokenQueryOptionsWithClient,
  getGetTokensMultiChainQueryOptions as getGetTokensMultiChainQueryOptionsWithClient,
  getGetTokensQueryOptions as getGetTokensQueryOptionsWithClient,
  getListTokensQueryOptions as getListTokensQueryOptionsWithClient,
  type GetTokenBuySellStatsInput,
  type GetTokenHistoryOHLCInput,
  type GetTokenHistoryPriceInput,
  type GetTokenHistoryTVLInput,
  type GetTokenHistoryVolumeInput,
  type GetTokenInput,
  type GetTokenMarketsInput,
  type GetTokenMarketsMultiChainInput,
  type GetTokenMultiChainInput,
  type GetTokensInput,
  type GetTokensMultiChainInput,
  type ListTokensInput,
} from '@universe/data-api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { getFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { getEnabledChains } from 'uniswap/src/features/chains/utils'

function getMultichainChainIds(): UniverseChainId[] {
  // Metadata spans every chain the app can render, regardless of testnet mode.
  return getEnabledChains({
    includeTestnets: true,
    isTestnetModeEnabled: false,
    featureFlaggedChainIds: getFeatureFlaggedChainIds(),
  }).chains
}

export function getGetTokenQueryOptions<TSelectData = PlainMessage<GetTokenResponse>>(
  input: GetTokenInput<TSelectData>,
): ReturnType<typeof getGetTokenQueryOptionsWithClient<TSelectData>> {
  return getGetTokenQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getGetTokensQueryOptions<TSelectData = PlainMessage<GetTokensResponse>>(
  input: GetTokensInput<TSelectData>,
): ReturnType<typeof getGetTokensQueryOptionsWithClient<TSelectData>> {
  return getGetTokensQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getGetTokenMultiChainQueryOptions<TSelectData = PlainMessage<GetTokenMultiChainResponse>>(
  input: GetTokenMultiChainInput<TSelectData>,
): ReturnType<typeof getGetTokenMultiChainQueryOptionsWithClient<TSelectData>> {
  return getGetTokenMultiChainQueryOptionsWithClient(dataApiServiceClientV2, {
    ...input,
    params: input.params
      ? {
          ...input.params,
          chainIds: getMultichainChainIds(),
        }
      : undefined,
  })
}

export function getGetTokensMultiChainQueryOptions<TSelectData = PlainMessage<GetTokensMultiChainResponse>>(
  input: GetTokensMultiChainInput<TSelectData>,
): ReturnType<typeof getGetTokensMultiChainQueryOptionsWithClient<TSelectData>> {
  return getGetTokensMultiChainQueryOptionsWithClient(dataApiServiceClientV2, {
    ...input,
    params: input.params
      ? {
          ...input.params,
          chainIds: getMultichainChainIds(),
        }
      : undefined,
  })
}

export function getGetTokenMarketsQueryOptions<TSelectData = PlainMessage<GetTokenMarketsResponse>>(
  input: GetTokenMarketsInput<TSelectData>,
): ReturnType<typeof getGetTokenMarketsQueryOptionsWithClient<TSelectData>> {
  return getGetTokenMarketsQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getGetTokenMarketsMultiChainQueryOptions<TSelectData = PlainMessage<GetTokenMarketsMultiChainResponse>>(
  input: GetTokenMarketsMultiChainInput<TSelectData>,
): ReturnType<typeof getGetTokenMarketsMultiChainQueryOptionsWithClient<TSelectData>> {
  return getGetTokenMarketsMultiChainQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getGetTokenHistoryPriceQueryOptions<TSelectData = PlainMessage<GetTokenHistoryPriceResponse>>(
  input: GetTokenHistoryPriceInput<TSelectData>,
): ReturnType<typeof getGetTokenHistoryPriceQueryOptionsWithClient<TSelectData>> {
  return getGetTokenHistoryPriceQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getGetTokenHistoryOHLCQueryOptions<TSelectData = PlainMessage<GetTokenHistoryOHLCResponse>>(
  input: GetTokenHistoryOHLCInput<TSelectData>,
): ReturnType<typeof getGetTokenHistoryOHLCQueryOptionsWithClient<TSelectData>> {
  return getGetTokenHistoryOHLCQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getGetTokenHistoryVolumeQueryOptions<TSelectData = PlainMessage<GetTokenHistoryVolumeResponse>>(
  input: GetTokenHistoryVolumeInput<TSelectData>,
): ReturnType<typeof getGetTokenHistoryVolumeQueryOptionsWithClient<TSelectData>> {
  return getGetTokenHistoryVolumeQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getGetTokenHistoryTVLQueryOptions<TSelectData = PlainMessage<GetTokenHistoryTVLResponse>>(
  input: GetTokenHistoryTVLInput<TSelectData>,
): ReturnType<typeof getGetTokenHistoryTVLQueryOptionsWithClient<TSelectData>> {
  return getGetTokenHistoryTVLQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getGetTokenBuySellStatsQueryOptions<TSelectData = PlainMessage<GetTokenBuySellStatsResponse>>(
  input: GetTokenBuySellStatsInput<TSelectData>,
): ReturnType<typeof getGetTokenBuySellStatsQueryOptionsWithClient<TSelectData>> {
  return getGetTokenBuySellStatsQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getListTokensQueryOptions<TSelectData = PlainMessage<ListTokensResponse>>(
  input: ListTokensInput<TSelectData>,
): ReturnType<typeof getListTokensQueryOptionsWithClient<TSelectData>> {
  return getListTokensQueryOptionsWithClient(dataApiServiceClientV2, input)
}
