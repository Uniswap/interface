import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { type QueryKey, queryOptions } from '@tanstack/react-query'
import type {
  ClaimLPRewardsRequest,
  ClaimLPRewardsResponse,
  MigrateV3ToV4LPPositionRequest,
  MigrateV3ToV4LPPositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import type {
  ClaimFeesRequest,
  ClaimFeesResponse,
  CreateClassicPositionRequest,
  CreateClassicPositionResponse,
  CreatePositionRequest,
  CreatePositionResponse,
  DecreasePositionRequest,
  DecreasePositionResponse,
  GetPositionRequest,
  GetPositionResponse,
  GetWalletPositionsBalanceRequest,
  GetWalletPositionsBalanceResponse,
  GetWalletPositionsRequest,
  GetWalletPositionsResponse,
  IncreasePositionRequest,
  IncreasePositionResponse,
  LPApprovalRequest,
  LPApprovalResponse,
  MigrateV2ToV3LPPositionRequest,
  MigrateV2ToV3LPPositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import type { PositionListCursor } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { type UseQueryApiHelperHookArgs } from '@universe/api'
import {
  V1LiquidityServiceClient,
  V2LiquidityServiceClient,
} from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableInfiniteQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export function getCheckLPApprovalQueryOptions(
  client: typeof V2LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<LPApprovalRequest, LPApprovalResponse>,
): QueryOptionsResult<LPApprovalResponse, Error, LPApprovalResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'checkLPApproval', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.checkLPApproval(params)
    },
    ...rest,
  })
}

export function getClaimFeesQueryOptions(
  client: typeof V2LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<ClaimFeesRequest, ClaimFeesResponse>,
): QueryOptionsResult<ClaimFeesResponse, Error, ClaimFeesResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'claimV2Fees', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.claimFees(params)
    },
    ...rest,
  })
}

export function getClaimLPRewardsQueryOptions(
  client: typeof V1LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<ClaimLPRewardsRequest, ClaimLPRewardsResponse>,
): QueryOptionsResult<ClaimLPRewardsResponse, Error, ClaimLPRewardsResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'claimRewards', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.claimRewards(params)
    },
    ...rest,
  })
}

export function getMigrateV2ToV3LPPositionQueryOptions(
  client: typeof V2LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<MigrateV2ToV3LPPositionRequest, MigrateV2ToV3LPPositionResponse>,
): QueryOptionsResult<MigrateV2ToV3LPPositionResponse, Error, MigrateV2ToV3LPPositionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'migrateV2ToV3', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.migrateV2ToV3LpPosition(params)
    },
    ...rest,
  })
}

export function getMigrateV3ToV4LPPositionQueryOptions(
  client: typeof V1LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<MigrateV3ToV4LPPositionRequest, MigrateV3ToV4LPPositionResponse>,
): QueryOptionsResult<MigrateV3ToV4LPPositionResponse, Error, MigrateV3ToV4LPPositionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'migrateV3ToV4', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.migrateV3ToV4LpPosition(params)
    },
    ...rest,
  })
}

export function getCreateClassicPositionQueryOptions(
  client: typeof V2LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<CreateClassicPositionRequest, CreateClassicPositionResponse>,
): QueryOptionsResult<CreateClassicPositionResponse, Error, CreateClassicPositionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'createClassicPosition', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.createClassicPosition(params)
    },
    ...rest,
  })
}

export function getCreatePositionQueryOptions(
  client: typeof V2LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<CreatePositionRequest, CreatePositionResponse>,
): QueryOptionsResult<CreatePositionResponse, Error, CreatePositionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'createPosition', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.createPosition(params)
    },
    ...rest,
  })
}

export function getDecreasePositionQueryOptions(
  client: typeof V2LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<DecreasePositionRequest, DecreasePositionResponse>,
): QueryOptionsResult<DecreasePositionResponse, Error, DecreasePositionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'decreasePosition', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.decreasePosition(params)
    },
    ...rest,
  })
}

export function getIncreasePositionQueryOptions(
  client: typeof V2LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<IncreasePositionRequest, IncreasePositionResponse>,
): QueryOptionsResult<IncreasePositionResponse, Error, IncreasePositionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'increasePosition', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.increasePosition(params)
    },
    ...rest,
  })
}

export function getGetPositionQueryOptions(
  client: typeof V2LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<GetPositionRequest, GetPositionResponse>,
): QueryOptionsResult<GetPositionResponse, Error, GetPositionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'getPosition', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.getPosition(params)
    },
    ...rest,
  })
}

export type GetWalletPositionsInput = {
  params?: Omit<PartialMessage<GetWalletPositionsRequest>, 'cursor'>
  enabled?: boolean
}

type GetWalletPositionsQueryKey = readonly [
  ReactQueryCacheKey.LiquidityService,
  'getWalletPositions',
  GetWalletPositionsInput['params'],
]

// Cursor-based pagination: the page param is the structured cursor returned by the previous page
// (undefined for the first page) and is passed straight back to the request as `cursor`.
type GetWalletPositionsPageParam = PlainMessage<PositionListCursor> | undefined

// Persisted to disk, so pages must be plain objects: a raw Message serializes as wire-format JSON
// (enums as strings, int64 as strings) and restores unparseable.
export type GetWalletPositions = PlainMessage<GetWalletPositionsResponse>

export function getGetWalletPositionsQueryOptions(
  client: typeof V2LiquidityServiceClient,
  { params, enabled }: GetWalletPositionsInput,
): ReturnType<
  typeof persistableInfiniteQueryOptions<
    GetWalletPositions,
    Error,
    GetWalletPositions,
    GetWalletPositionsQueryKey,
    GetWalletPositionsPageParam
  >
> {
  return persistableInfiniteQueryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'getWalletPositions', params] as const,
    queryFn: async ({ pageParam }: { pageParam: GetWalletPositionsPageParam }): Promise<GetWalletPositions> => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.getWalletPositions({ ...params, cursor: pageParam }))
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: GetWalletPositions) => lastPage.nextCursor,
    enabled,
  })
}

/**
 * A wallet's aggregate USD position totals. Callers pass only wallet + chains: this is the wallet's
 * total, not a total of the rows a list is showing — see `useWalletPositionsBalance`.
 *
 * Keyed under the `getWalletPositions` prefix so every existing positions refetch/invalidate site
 * (`WALLET_POSITIONS_QUERY_KEY_PREFIX`) covers it without a second call site to keep in sync. That
 * prefix now spans two differently shaped queries — the infinite list (`InfiniteData`, with `pages`)
 * and this plain one — so a prefix-scoped `setQueriesData` mapping `old.pages` would throw here.
 * Safe today because every writer under the prefix is invalidate/refetch-only.
 */
export function getGetWalletPositionsBalanceQueryOptions(
  client: typeof V2LiquidityServiceClient,
  {
    params,
    ...rest
  }: UseQueryApiHelperHookArgs<PartialMessage<GetWalletPositionsBalanceRequest>, GetWalletPositionsBalanceResponse>,
): QueryOptionsResult<GetWalletPositionsBalanceResponse, Error, GetWalletPositionsBalanceResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'getWalletPositions', 'balance', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.getWalletPositionsBalance(params)
    },
    ...rest,
  })
}
