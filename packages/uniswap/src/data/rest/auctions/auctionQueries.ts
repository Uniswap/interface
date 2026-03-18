import { QueryKey, queryOptions } from '@tanstack/react-query'
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
  ListTopAuctionsRequest,
  ListTopAuctionsResponse,
} from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { AuctionServiceClient } from '@universe/api/src/clients/auctions/createAuctionServiceClient'
import { UseQueryApiHelperHookArgs } from '@universe/api/src/hooks/shared/types'
import { AuctionServiceClient as AuctionServiceClientInstance } from 'uniswap/src/data/rest/auctions/AuctionServiceClient'
import { AUCTION_DEFAULT_RETRY, AuctionStaleTime } from 'uniswap/src/data/rest/auctions/queryTypes'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

function getAuctionQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetAuctionRequest, GetAuctionResponse>,
): QueryOptionsResult<GetAuctionResponse, Error, GetAuctionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getAuction', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.getAuction(params)
    },
    staleTime: AuctionStaleTime.FAST,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getAuctionActivityQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetAuctionActivityRequest, GetAuctionActivityResponse>,
): QueryOptionsResult<GetAuctionActivityResponse, Error, GetAuctionActivityResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getAuctionActivity', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.getAuctionActivity(params)
    },
    staleTime: AuctionStaleTime.MODERATE,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getBidsQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetBidsRequest, GetBidsResponse>,
): QueryOptionsResult<GetBidsResponse, Error, GetBidsResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getBids', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.getBids(params)
    },
    staleTime: AuctionStaleTime.FAST,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getBidsByWalletQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetBidsByWalletRequest, GetBidsByWalletResponse>,
): QueryOptionsResult<GetBidsByWalletResponse, Error, GetBidsByWalletResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getBidsByWallet', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.getBidsByWallet(params)
    },
    staleTime: AuctionStaleTime.MODERATE,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getClearingPriceHistoryQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetClearingPriceHistoryRequest, GetClearingPriceHistoryResponse>,
): QueryOptionsResult<GetClearingPriceHistoryResponse, Error, GetClearingPriceHistoryResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getClearingPriceHistory', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.getClearingPriceHistory(params)
    },
    staleTime: AuctionStaleTime.FAST,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getLatestCheckpointQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetLatestCheckpointRequest, GetLatestCheckpointResponse>,
): QueryOptionsResult<GetLatestCheckpointResponse, Error, GetLatestCheckpointResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'getLatestCheckpoint', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.getLatestCheckpoint(params)
    },
    staleTime: AuctionStaleTime.REALTIME,
    retry: AUCTION_DEFAULT_RETRY,
    ...rest,
  })
}

function getListTopAuctionsQueryOptions(
  client: AuctionServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<ListTopAuctionsRequest, ListTopAuctionsResponse>,
): QueryOptionsResult<ListTopAuctionsResponse, Error, ListTopAuctionsResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'listTopAuctions', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.listTopAuctions(params)
    },
    ...rest,
  })
}

function provideAuctionQueries(client: AuctionServiceClient): {
  getAuction: (
    input: UseQueryApiHelperHookArgs<GetAuctionRequest, GetAuctionResponse>,
  ) => QueryOptionsResult<GetAuctionResponse, Error, GetAuctionResponse, QueryKey>
  getAuctionActivity: (
    input: UseQueryApiHelperHookArgs<GetAuctionActivityRequest, GetAuctionActivityResponse>,
  ) => QueryOptionsResult<GetAuctionActivityResponse, Error, GetAuctionActivityResponse, QueryKey>
  getBids: (
    input: UseQueryApiHelperHookArgs<GetBidsRequest, GetBidsResponse>,
  ) => QueryOptionsResult<GetBidsResponse, Error, GetBidsResponse, QueryKey>
  getBidsByWallet: (
    input: UseQueryApiHelperHookArgs<GetBidsByWalletRequest, GetBidsByWalletResponse>,
  ) => QueryOptionsResult<GetBidsByWalletResponse, Error, GetBidsByWalletResponse, QueryKey>
  getClearingPriceHistory: (
    input: UseQueryApiHelperHookArgs<GetClearingPriceHistoryRequest, GetClearingPriceHistoryResponse>,
  ) => QueryOptionsResult<GetClearingPriceHistoryResponse, Error, GetClearingPriceHistoryResponse, QueryKey>
  getLatestCheckpoint: (
    input: UseQueryApiHelperHookArgs<GetLatestCheckpointRequest, GetLatestCheckpointResponse>,
  ) => QueryOptionsResult<GetLatestCheckpointResponse, Error, GetLatestCheckpointResponse, QueryKey>
  listTopAuctions: (
    input: UseQueryApiHelperHookArgs<ListTopAuctionsRequest, ListTopAuctionsResponse>,
  ) => QueryOptionsResult<ListTopAuctionsResponse, Error, ListTopAuctionsResponse, QueryKey>
} {
  return {
    getAuction: (input) => getAuctionQueryOptions(client, input),
    getAuctionActivity: (input) => getAuctionActivityQueryOptions(client, input),
    getBids: (input) => getBidsQueryOptions(client, input),
    getBidsByWallet: (input) => getBidsByWalletQueryOptions(client, input),
    getClearingPriceHistory: (input) => getClearingPriceHistoryQueryOptions(client, input),
    getLatestCheckpoint: (input) => getLatestCheckpointQueryOptions(client, input),
    listTopAuctions: (input) => getListTopAuctionsQueryOptions(client, input),
  }
}

export const auctionQueries = provideAuctionQueries(AuctionServiceClientInstance)
