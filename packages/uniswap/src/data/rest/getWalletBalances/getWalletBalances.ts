import { type PartialMessage, type PlainMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { queryOptions, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type {
  BalanceComponent,
  GetWalletBalancesRequest,
  GetWalletBalancesResponse,
  WalletBalance,
} from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { createDataApiServiceClient, getGetWalletBalancesQueryOptions, type WithoutWalletAccount } from '@universe/api'
import { FeatureFlags, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import { useMemo } from 'react'
import { entryGatewayPostTransport } from 'uniswap/src/data/rest/base'
import { type PortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

/** Which part of `WalletBalance` a consumer wants. All three derive from one cache entry via React Query's `select`. */
export enum PortfolioBalancePart {
  Total = 'total',
  Tokens = 'tokens',
  Pools = 'pools',
}

/** All three parts materialized in one pass, for callers that need them together. */
export type PortfolioBalanceBreakdown = {
  total: PortfolioTotalValue
  tokens: PortfolioTotalValue
  pools: PortfolioTotalValue
  failedChainIds: number[]
}

/**
 * Resolves the opt-in `include_categories` to send with `GetWalletBalances`. Both the read hooks and
 * the optimistic cache writers use this so every caller produces the same query key.
 */
export function useWalletBalancesIncludeCategories(): WalletBalanceCategory[] {
  // Read without logging; the pools exposure is logged only where the feature is actually shown (see usePoolsTabVisibility).
  const portfolioPoolsBalancesEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.PortfolioPoolsBalances)
  return useMemo(
    () => (portfolioPoolsBalancesEnabled ? [WalletBalanceCategory.POOLS] : []),
    [portfolioPoolsBalancesEnabled],
  )
}

type PortfolioValueSlice = {
  [K in keyof PortfolioBalanceBreakdown]: PortfolioBalanceBreakdown[K] extends PortfolioTotalValue ? K : never
}[keyof PortfolioBalanceBreakdown]

/**
 * The breakdown slice each opt-in category populates. `tokens` is always returned, so it is not an
 * opt-in category. Supporting a new category is a single entry here.
 */
const BREAKDOWN_SLICE_BY_CATEGORY: Partial<Record<WalletBalanceCategory, PortfolioValueSlice>> = {
  [WalletBalanceCategory.POOLS]: 'pools',
}

/**
 * True when the wallet's aggregate total is present and non-positive: an empty wallet. The total is
 * set only when every requested category resolved, so an omitted total means data is missing, not
 * that the wallet is empty.
 */
export function isEmptyWalletBalance(breakdown: PortfolioBalanceBreakdown | undefined): boolean {
  if (!breakdown) {
    return false
  }
  return breakdown.total.balanceUSD !== undefined && breakdown.total.balanceUSD <= 0
}

/**
 * Returns the requested categories whose breakdown slice the backend omitted (`balanceUSD` is
 * `undefined`), which means the aggregate total is incomplete. Categories that were not requested
 * are omitted by design and never reported. `0` is a valid balance, not a missing one.
 */
export function getUnavailableCategories({
  breakdown,
  requestedCategories,
}: {
  breakdown: PortfolioBalanceBreakdown | undefined
  requestedCategories: WalletBalanceCategory[]
}): WalletBalanceCategory[] {
  if (!breakdown) {
    return []
  }
  return requestedCategories.filter((category) => {
    const slice = BREAKDOWN_SLICE_BY_CATEGORY[category]
    return slice !== undefined && breakdown[slice].balanceUSD === undefined
  })
}

export type GetWalletBalancesInput<TSelectData = PlainMessage<GetWalletBalancesResponse>> = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletBalancesRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
  enabled?: boolean
  /** Cache-only read: never fetches, but still re-renders when another observer updates the cached data. */
  cacheOnly?: boolean
  refetchInterval?: number | false
  select?: (data: PlainMessage<GetWalletBalancesResponse> | undefined) => TSelectData
}

const dataApiClient = createDataApiServiceClient({
  rpcClient: createPromiseClient(DataApiService, entryGatewayPostTransport),
})

/** Wrapper around `DataApiService/GetWalletBalances`. The response is aggregate-only (no per-token entries). */
export function useGetWalletBalancesQuery<TSelectData = PlainMessage<GetWalletBalancesResponse>>(
  params: GetWalletBalancesInput<TSelectData>,
): UseQueryResult<TSelectData, Error> {
  return useQuery(getWalletBalancesQuery(params))
}

type GetWalletBalancesQueryKey = readonly [
  ReactQueryCacheKey.GetWalletBalances,
  { evmAddress?: string; svmAddress?: string },
  Record<string, unknown>,
]

type GetWalletBalancesQuery<TSelectData = PlainMessage<GetWalletBalancesResponse>> = QueryOptionsResult<
  PlainMessage<GetWalletBalancesResponse> | undefined,
  Error,
  TSelectData,
  GetWalletBalancesQueryKey
>

export const getWalletBalancesQuery = <TSelectData = PlainMessage<GetWalletBalancesResponse>>({
  input,
  enabled = true,
  cacheOnly = false,
  refetchInterval,
  select,
}: GetWalletBalancesInput<TSelectData>): GetWalletBalancesQuery<TSelectData> => {
  const baseOptions = getGetWalletBalancesQueryOptions(dataApiClient, { input })

  // `meta.persist: true` propagates from `baseOptions` for cold-start hydration on mobile + extension.
  return queryOptions({
    ...baseOptions,
    enabled: enabled && !cacheOnly,
    refetchInterval,
    subscribed: cacheOnly || !!enabled,
    notifyOnChangeProps: cacheOnly ? ['data'] : undefined,
    select,
  })
}

const mapBalanceComponent = (component: PlainMessage<BalanceComponent> | undefined): PortfolioTotalValue => ({
  balanceUSD: component?.valueUsd,
  percentChange: component?.percentChange1d,
  absoluteChangeUSD: component?.absoluteChange1d,
  count: component?.count,
})

const getBalance = (
  data: PlainMessage<GetWalletBalancesResponse> | undefined,
): PlainMessage<WalletBalance> | undefined => data?.balance

export const selectPortfolioTotal = (
  data: PlainMessage<GetWalletBalancesResponse> | undefined,
): PortfolioTotalValue | undefined => {
  const balance = getBalance(data)
  return balance ? mapBalanceComponent(balance.total) : undefined
}

export const selectPortfolioTokens = (
  data: PlainMessage<GetWalletBalancesResponse> | undefined,
): PortfolioTotalValue | undefined => {
  const balance = getBalance(data)
  return balance ? mapBalanceComponent(balance.tokens) : undefined
}

export const selectPortfolioPools = (
  data: PlainMessage<GetWalletBalancesResponse> | undefined,
): PortfolioTotalValue | undefined => {
  const balance = getBalance(data)
  return balance ? mapBalanceComponent(balance.pools) : undefined
}

export const selectPortfolioBalanceBreakdown = (
  data: PlainMessage<GetWalletBalancesResponse> | undefined,
): PortfolioBalanceBreakdown | undefined => {
  const balance = getBalance(data)
  return balance
    ? {
        total: mapBalanceComponent(balance.total),
        tokens: mapBalanceComponent(balance.tokens),
        pools: mapBalanceComponent(balance.pools),
        failedChainIds: balance.failedChainIds,
      }
    : undefined
}

/** Resolves a part identifier to its selector. */
export function selectorForPart(
  part: PortfolioBalancePart,
): (data: PlainMessage<GetWalletBalancesResponse> | undefined) => PortfolioTotalValue | undefined {
  switch (part) {
    case PortfolioBalancePart.Tokens:
      return selectPortfolioTokens
    case PortfolioBalancePart.Pools:
      return selectPortfolioPools
    case PortfolioBalancePart.Total:
    default:
      return selectPortfolioTotal
  }
}

/** Query key format (from `@universe/api`): `[GetWalletBalances, { evmAddress?, svmAddress? }, queryCacheInputs]`. */
export function doesGetWalletBalancesQueryMatchAddress({
  queryKey,
  address,
  platform,
}: {
  queryKey: readonly unknown[]
  address: string
  platform: Platform
}): boolean {
  const [key, addressKey] = queryKey

  if (key !== ReactQueryCacheKey.GetWalletBalances || typeof addressKey !== 'object' || addressKey === null) {
    return false
  }

  const keyWithAddresses = addressKey as { evmAddress?: string; svmAddress?: string }
  const queryAddress = platform === Platform.EVM ? keyWithAddresses.evmAddress : keyWithAddresses.svmAddress

  if (!queryAddress) {
    return false
  }

  return areAddressesEqual({
    addressInput1: { address, platform },
    addressInput2: { address: queryAddress, platform },
  })
}
