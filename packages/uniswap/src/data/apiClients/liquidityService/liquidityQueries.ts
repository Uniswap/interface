import { type QueryKey, queryOptions } from '@tanstack/react-query'
import type {
  CheckApprovalLPRequest,
  CheckApprovalLPResponse,
  ClaimLPFeesRequest,
  ClaimLPFeesResponse,
  ClaimLPRewardsRequest,
  ClaimLPRewardsResponse,
  CreateLPPositionRequest,
  CreateLPPositionResponse,
  DecreaseLPPositionRequest,
  DecreaseLPPositionResponse,
  IncreaseLPPositionRequest,
  IncreaseLPPositionResponse,
  MigrateV2ToV3LPPositionRequest,
  MigrateV2ToV3LPPositionResponse,
  MigrateV3ToV4LPPositionRequest,
  MigrateV3ToV4LPPositionResponse,
  PoolInfoRequest,
  PoolInfoResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { type UseQueryApiHelperHookArgs } from '@universe/api'
import { LiquidityServiceClient } from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

function getPoolInfoQueryOptions(
  client: typeof LiquidityServiceClient,
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
  client: typeof LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<CheckApprovalLPRequest, CheckApprovalLPResponse>,
): QueryOptionsResult<CheckApprovalLPResponse, Error, CheckApprovalLPResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'checkApproval', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.checkApproval(params)
    },
    ...rest,
  })
}

function getClaimLPFeesQueryOptions(
  client: typeof LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<ClaimLPFeesRequest, ClaimLPFeesResponse>,
): QueryOptionsResult<ClaimLPFeesResponse, Error, ClaimLPFeesResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'claimFees', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.claimLpFees(params)
    },
    ...rest,
  })
}

function getClaimLPRewardsQueryOptions(
  client: typeof LiquidityServiceClient,
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

function getDecreaseLPPositionQueryOptions(
  client: typeof LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<DecreaseLPPositionRequest, DecreaseLPPositionResponse>,
): QueryOptionsResult<DecreaseLPPositionResponse, Error, DecreaseLPPositionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'decreasePosition', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.decreaseLpPosition(params)
    },
    ...rest,
  })
}

function getMigrateV2ToV3LPPositionQueryOptions(
  client: typeof LiquidityServiceClient,
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
  client: typeof LiquidityServiceClient,
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

function getCreateLPPositionQueryOptions(
  client: typeof LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<CreateLPPositionRequest, CreateLPPositionResponse>,
): QueryOptionsResult<CreateLPPositionResponse, Error, CreateLPPositionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'createPosition', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.createLpPosition(params)
    },
    ...rest,
  })
}

function getIncreaseLPPositionQueryOptions(
  client: typeof LiquidityServiceClient,
  { params, ...rest }: UseQueryApiHelperHookArgs<IncreaseLPPositionRequest, IncreaseLPPositionResponse>,
): QueryOptionsResult<IncreaseLPPositionResponse, Error, IncreaseLPPositionResponse, QueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.LiquidityService, 'increasePosition', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.increaseLpPosition(params)
    },
    ...rest,
  })
}

function provideLiquidityQueries(client: typeof LiquidityServiceClient): {
  poolInfo: (
    input: UseQueryApiHelperHookArgs<PoolInfoRequest, PoolInfoResponse>,
  ) => QueryOptionsResult<PoolInfoResponse, Error, PoolInfoResponse, QueryKey>
  checkApproval: (
    input: UseQueryApiHelperHookArgs<CheckApprovalLPRequest, CheckApprovalLPResponse>,
  ) => QueryOptionsResult<CheckApprovalLPResponse, Error, CheckApprovalLPResponse, QueryKey>
  claimFees: (
    input: UseQueryApiHelperHookArgs<ClaimLPFeesRequest, ClaimLPFeesResponse>,
  ) => QueryOptionsResult<ClaimLPFeesResponse, Error, ClaimLPFeesResponse, QueryKey>
  claimRewards: (
    input: UseQueryApiHelperHookArgs<ClaimLPRewardsRequest, ClaimLPRewardsResponse>,
  ) => QueryOptionsResult<ClaimLPRewardsResponse, Error, ClaimLPRewardsResponse, QueryKey>
  createPosition: (
    input: UseQueryApiHelperHookArgs<CreateLPPositionRequest, CreateLPPositionResponse>,
  ) => QueryOptionsResult<CreateLPPositionResponse, Error, CreateLPPositionResponse, QueryKey>
  decreasePosition: (
    input: UseQueryApiHelperHookArgs<DecreaseLPPositionRequest, DecreaseLPPositionResponse>,
  ) => QueryOptionsResult<DecreaseLPPositionResponse, Error, DecreaseLPPositionResponse, QueryKey>
  migrateV2ToV3: (
    input: UseQueryApiHelperHookArgs<MigrateV2ToV3LPPositionRequest, MigrateV2ToV3LPPositionResponse>,
  ) => QueryOptionsResult<MigrateV2ToV3LPPositionResponse, Error, MigrateV2ToV3LPPositionResponse, QueryKey>
  migrateV3ToV4: (
    input: UseQueryApiHelperHookArgs<MigrateV3ToV4LPPositionRequest, MigrateV3ToV4LPPositionResponse>,
  ) => QueryOptionsResult<MigrateV3ToV4LPPositionResponse, Error, MigrateV3ToV4LPPositionResponse, QueryKey>
  increasePosition: (
    input: UseQueryApiHelperHookArgs<IncreaseLPPositionRequest, IncreaseLPPositionResponse>,
  ) => QueryOptionsResult<IncreaseLPPositionResponse, Error, IncreaseLPPositionResponse, QueryKey>
} {
  return {
    poolInfo: (input: UseQueryApiHelperHookArgs<PoolInfoRequest, PoolInfoResponse>) =>
      getPoolInfoQueryOptions(client, input),
    checkApproval: (input: UseQueryApiHelperHookArgs<CheckApprovalLPRequest, CheckApprovalLPResponse>) =>
      getCheckLPApprovalQueryOptions(client, input),
    claimFees: (input: UseQueryApiHelperHookArgs<ClaimLPFeesRequest, ClaimLPFeesResponse>) =>
      getClaimLPFeesQueryOptions(client, input),
    claimRewards: (input: UseQueryApiHelperHookArgs<ClaimLPRewardsRequest, ClaimLPRewardsResponse>) =>
      getClaimLPRewardsQueryOptions(client, input),
    createPosition: (input: UseQueryApiHelperHookArgs<CreateLPPositionRequest, CreateLPPositionResponse>) =>
      getCreateLPPositionQueryOptions(client, input),
    decreasePosition: (input: UseQueryApiHelperHookArgs<DecreaseLPPositionRequest, DecreaseLPPositionResponse>) =>
      getDecreaseLPPositionQueryOptions(client, input),
    migrateV2ToV3: (
      input: UseQueryApiHelperHookArgs<MigrateV2ToV3LPPositionRequest, MigrateV2ToV3LPPositionResponse>,
    ) => getMigrateV2ToV3LPPositionQueryOptions(client, input),
    migrateV3ToV4: (
      input: UseQueryApiHelperHookArgs<MigrateV3ToV4LPPositionRequest, MigrateV3ToV4LPPositionResponse>,
    ) => getMigrateV3ToV4LPPositionQueryOptions(client, input),
    increasePosition: (input: UseQueryApiHelperHookArgs<IncreaseLPPositionRequest, IncreaseLPPositionResponse>) =>
      getIncreaseLPPositionQueryOptions(client, input),
  }
}

export const liquidityQueries = provideLiquidityQueries(LiquidityServiceClient)
