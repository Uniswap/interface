import { type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { QueryKey } from '@tanstack/react-query'
import {
  GetAuctionActivityRequest,
  GetAuctionActivityResponse,
  GetAuctionRequest,
  GetAuctionResponse,
  GetBidsByWalletRequest,
  GetBidsByWalletResponse,
  GetBidsRequest,
  GetBidsResponse,
  GetClearingPriceHistoryRequest,
  GetClearingPriceHistoryResponse,
  GetLatestCheckpointRequest,
  GetLatestCheckpointResponse,
  GetTickDetailsRequest,
  GetTickDetailsResponse,
  ListTopAuctionsRequest,
  ListTopAuctionsResponse,
} from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { AuctionServiceClient, UseQueryApiHelperHookArgs } from '@universe/api'
import { AuctionServiceClient as AuctionServiceClientInstance } from 'uniswap/src/data/rest/auctions/AuctionServiceClient'
import { AUCTION_DEFAULT_RETRY, AuctionStaleTime } from 'uniswap/src/data/rest/auctions/queryTypes'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

function getAuctionQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetAuctionRequest, PlainMessage<GetAuctionResponse>>,
): QueryOptionsResult<PlainMessage<GetAuctionResponse>, Error, PlainMessage<GetAuctionResponse>, QueryKey> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getAuction', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.getAuction(params))
    },
    staleTime: AuctionStaleTime.FAST,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getAuctionActivityQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetAuctionActivityRequest, PlainMessage<GetAuctionActivityResponse>>,
): QueryOptionsResult<
  PlainMessage<GetAuctionActivityResponse>,
  Error,
  PlainMessage<GetAuctionActivityResponse>,
  QueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getAuctionActivity', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.getAuctionActivity(params))
    },
    staleTime: AuctionStaleTime.MODERATE,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getBidsQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetBidsRequest, PlainMessage<GetBidsResponse>>,
): QueryOptionsResult<PlainMessage<GetBidsResponse>, Error, PlainMessage<GetBidsResponse>, QueryKey> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getBids', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.getBids(params))
    },
    staleTime: AuctionStaleTime.FAST,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getBidsByWalletQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetBidsByWalletRequest, PlainMessage<GetBidsByWalletResponse>>,
): QueryOptionsResult<PlainMessage<GetBidsByWalletResponse>, Error, PlainMessage<GetBidsByWalletResponse>, QueryKey> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getBidsByWallet', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.getBidsByWallet(params))
    },
    staleTime: AuctionStaleTime.MODERATE,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getClearingPriceHistoryQueryOptions(
  client: AuctionServiceClient,
  {
    params,
    ...rest
  }: UseQueryApiHelperHookArgs<GetClearingPriceHistoryRequest, PlainMessage<GetClearingPriceHistoryResponse>>,
): QueryOptionsResult<
  PlainMessage<GetClearingPriceHistoryResponse>,
  Error,
  PlainMessage<GetClearingPriceHistoryResponse>,
  QueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getClearingPriceHistory', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.getClearingPriceHistory(params))
    },
    staleTime: AuctionStaleTime.FAST,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getLatestCheckpointQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetLatestCheckpointRequest, PlainMessage<GetLatestCheckpointResponse>>,
): QueryOptionsResult<
  PlainMessage<GetLatestCheckpointResponse>,
  Error,
  PlainMessage<GetLatestCheckpointResponse>,
  QueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getLatestCheckpoint', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.getLatestCheckpoint(params))
    },
    staleTime: AuctionStaleTime.REALTIME,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getTickDetailsQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetTickDetailsRequest, PlainMessage<GetTickDetailsResponse>>,
): QueryOptionsResult<PlainMessage<GetTickDetailsResponse>, Error, PlainMessage<GetTickDetailsResponse>, QueryKey> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getTickDetails', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.getTickDetails(params))
    },
    staleTime: AuctionStaleTime.FAST,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getListTopAuctionsQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<ListTopAuctionsRequest, PlainMessage<ListTopAuctionsResponse>>,
): QueryOptionsResult<PlainMessage<ListTopAuctionsResponse>, Error, PlainMessage<ListTopAuctionsResponse>, QueryKey> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'listTopAuctions', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.listTopAuctions(params))
    },
    ...rest,
  })
}

function provideAuctionQueries(client: AuctionServiceClient): {
  getAuction: (
    input: UseQueryApiHelperHookArgs<GetAuctionRequest, PlainMessage<GetAuctionResponse>>,
  ) => QueryOptionsResult<PlainMessage<GetAuctionResponse>, Error, PlainMessage<GetAuctionResponse>, QueryKey>
  getAuctionActivity: (
    input: UseQueryApiHelperHookArgs<GetAuctionActivityRequest, PlainMessage<GetAuctionActivityResponse>>,
  ) => QueryOptionsResult<
    PlainMessage<GetAuctionActivityResponse>,
    Error,
    PlainMessage<GetAuctionActivityResponse>,
    QueryKey
  >
  getBids: (
    input: UseQueryApiHelperHookArgs<GetBidsRequest, PlainMessage<GetBidsResponse>>,
  ) => QueryOptionsResult<PlainMessage<GetBidsResponse>, Error, PlainMessage<GetBidsResponse>, QueryKey>
  getBidsByWallet: (
    input: UseQueryApiHelperHookArgs<GetBidsByWalletRequest, PlainMessage<GetBidsByWalletResponse>>,
  ) => QueryOptionsResult<PlainMessage<GetBidsByWalletResponse>, Error, PlainMessage<GetBidsByWalletResponse>, QueryKey>
  getClearingPriceHistory: (
    input: UseQueryApiHelperHookArgs<GetClearingPriceHistoryRequest, PlainMessage<GetClearingPriceHistoryResponse>>,
  ) => QueryOptionsResult<
    PlainMessage<GetClearingPriceHistoryResponse>,
    Error,
    PlainMessage<GetClearingPriceHistoryResponse>,
    QueryKey
  >
  getLatestCheckpoint: (
    input: UseQueryApiHelperHookArgs<GetLatestCheckpointRequest, PlainMessage<GetLatestCheckpointResponse>>,
  ) => QueryOptionsResult<
    PlainMessage<GetLatestCheckpointResponse>,
    Error,
    PlainMessage<GetLatestCheckpointResponse>,
    QueryKey
  >
  getTickDetails: (
    input: UseQueryApiHelperHookArgs<GetTickDetailsRequest, PlainMessage<GetTickDetailsResponse>>,
  ) => QueryOptionsResult<PlainMessage<GetTickDetailsResponse>, Error, PlainMessage<GetTickDetailsResponse>, QueryKey>
  listTopAuctions: (
    input: UseQueryApiHelperHookArgs<ListTopAuctionsRequest, PlainMessage<ListTopAuctionsResponse>>,
  ) => QueryOptionsResult<PlainMessage<ListTopAuctionsResponse>, Error, PlainMessage<ListTopAuctionsResponse>, QueryKey>
} {
  return {
    getAuction: (input) => getAuctionQueryOptions(client, input),
    getAuctionActivity: (input) => getAuctionActivityQueryOptions(client, input),
    getBids: (input) => getBidsQueryOptions(client, input),
    getBidsByWallet: (input) => getBidsByWalletQueryOptions(client, input),
    getClearingPriceHistory: (input) => getClearingPriceHistoryQueryOptions(client, input),
    getLatestCheckpoint: (input) => getLatestCheckpointQueryOptions(client, input),
    getTickDetails: (input) => getTickDetailsQueryOptions(client, input),
    listTopAuctions: (input) => getListTopAuctionsQueryOptions(client, input),
  }
}

export const auctionQueries = provideAuctionQueries(AuctionServiceClientInstance)
