import { type QueryKey, queryOptions } from '@tanstack/react-query'
import type {
  ClaimLPRewardsRequest,
  ClaimLPRewardsResponse,
  MigrateV2ToV3LPPositionRequest,
  MigrateV2ToV3LPPositionResponse,
  MigrateV3ToV4LPPositionRequest,
  MigrateV3ToV4LPPositionResponse,
  PoolInfoRequest,
  PoolInfoResponse,
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
  IncreasePositionRequest,
  IncreasePositionResponse,
  LPApprovalRequest,
  LPApprovalResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { type UseQueryApiHelperHookArgs } from '@universe/api'
import {
  V1LiquidityServiceClient,
  V2LiquidityServiceClient,
} from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

function getPoolInfoQueryOptions(
  client: typeof V1LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<PoolInfoRequest, PoolInfoResponse>,
): QueryOptionsResult<PoolInfoResponse, Error, PoolInfoResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'poolInfo', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.poolInfo(params)
    },
    ...rest,
  })
}

function getCheckLPApprovalQueryOptions(
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

function getClaimFeesQueryOptions(
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

function getClaimLPRewardsQueryOptions(
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

function getMigrateV2ToV3LPPositionQueryOptions(
  client: typeof V1LiquidityServiceClient,
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

function getMigrateV3ToV4LPPositionQueryOptions(
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

function getCreateClassicPositionQueryOptions(
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

function getCreatePositionQueryOptions(
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

function getDecreasePositionQueryOptions(
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

function getIncreasePositionQueryOptions(
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

function provideLiquidityQueries(
  v1Client: typeof V1LiquidityServiceClient,
  v2Client: typeof V2LiquidityServiceClient,
): {
  poolInfo: (
    input: UseQueryApiHelperHookArgs<PoolInfoRequest, PoolInfoResponse>,
  ) => QueryOptionsResult<PoolInfoResponse, Error, PoolInfoResponse, QueryKey>
  checkApproval: (
    input: UseQueryApiHelperHookArgs<LPApprovalRequest, LPApprovalResponse>,
  ) => QueryOptionsResult<LPApprovalResponse, Error, LPApprovalResponse, QueryKey>
  claimFees: (
    input: UseQueryApiHelperHookArgs<ClaimFeesRequest, ClaimFeesResponse>,
  ) => QueryOptionsResult<ClaimFeesResponse, Error, ClaimFeesResponse, QueryKey>
  claimRewards: (
    input: UseQueryApiHelperHookArgs<ClaimLPRewardsRequest, ClaimLPRewardsResponse>,
  ) => QueryOptionsResult<ClaimLPRewardsResponse, Error, ClaimLPRewardsResponse, QueryKey>
  createClassicPosition: (
    input: UseQueryApiHelperHookArgs<CreateClassicPositionRequest, CreateClassicPositionResponse>,
  ) => QueryOptionsResult<CreateClassicPositionResponse, Error, CreateClassicPositionResponse, QueryKey>
  createPosition: (
    input: UseQueryApiHelperHookArgs<CreatePositionRequest, CreatePositionResponse>,
  ) => QueryOptionsResult<CreatePositionResponse, Error, CreatePositionResponse, QueryKey>
  decreasePosition: (
    input: UseQueryApiHelperHookArgs<DecreasePositionRequest, DecreasePositionResponse>,
  ) => QueryOptionsResult<DecreasePositionResponse, Error, DecreasePositionResponse, QueryKey>
  migrateV2ToV3: (
    input: UseQueryApiHelperHookArgs<MigrateV2ToV3LPPositionRequest, MigrateV2ToV3LPPositionResponse>,
  ) => QueryOptionsResult<MigrateV2ToV3LPPositionResponse, Error, MigrateV2ToV3LPPositionResponse, QueryKey>
  migrateV3ToV4: (
    input: UseQueryApiHelperHookArgs<MigrateV3ToV4LPPositionRequest, MigrateV3ToV4LPPositionResponse>,
  ) => QueryOptionsResult<MigrateV3ToV4LPPositionResponse, Error, MigrateV3ToV4LPPositionResponse, QueryKey>
  increasePosition: (
    input: UseQueryApiHelperHookArgs<IncreasePositionRequest, IncreasePositionResponse>,
  ) => QueryOptionsResult<IncreasePositionResponse, Error, IncreasePositionResponse, QueryKey>
} {
  return {
    poolInfo: (input: UseQueryApiHelperHookArgs<PoolInfoRequest, PoolInfoResponse>) =>
      getPoolInfoQueryOptions(v1Client, input),
    checkApproval: (input: UseQueryApiHelperHookArgs<LPApprovalRequest, LPApprovalResponse>) =>
      getCheckLPApprovalQueryOptions(v2Client, input),
    claimFees: (input: UseQueryApiHelperHookArgs<ClaimFeesRequest, ClaimFeesResponse>) =>
      getClaimFeesQueryOptions(v2Client, input),
    claimRewards: (input: UseQueryApiHelperHookArgs<ClaimLPRewardsRequest, ClaimLPRewardsResponse>) =>
      getClaimLPRewardsQueryOptions(v1Client, input),
    createClassicPosition: (
      input: UseQueryApiHelperHookArgs<CreateClassicPositionRequest, CreateClassicPositionResponse>,
    ) => getCreateClassicPositionQueryOptions(v2Client, input),
    createPosition: (input: UseQueryApiHelperHookArgs<CreatePositionRequest, CreatePositionResponse>) =>
      getCreatePositionQueryOptions(v2Client, input),
    decreasePosition: (input: UseQueryApiHelperHookArgs<DecreasePositionRequest, DecreasePositionResponse>) =>
      getDecreasePositionQueryOptions(v2Client, input),
    migrateV2ToV3: (
      input: UseQueryApiHelperHookArgs<MigrateV2ToV3LPPositionRequest, MigrateV2ToV3LPPositionResponse>,
    ) => getMigrateV2ToV3LPPositionQueryOptions(v1Client, input),
    migrateV3ToV4: (
      input: UseQueryApiHelperHookArgs<MigrateV3ToV4LPPositionRequest, MigrateV3ToV4LPPositionResponse>,
    ) => getMigrateV3ToV4LPPositionQueryOptions(v1Client, input),
    increasePosition: (input: UseQueryApiHelperHookArgs<IncreasePositionRequest, IncreasePositionResponse>) =>
      getIncreasePositionQueryOptions(v2Client, input),
  }
}

export const liquidityQueries = provideLiquidityQueries(V1LiquidityServiceClient, V2LiquidityServiceClient)
