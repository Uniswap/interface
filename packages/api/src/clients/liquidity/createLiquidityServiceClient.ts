import type {
  ClaimLPRewardsRequest,
  ClaimLPRewardsResponse,
  MigrateV2ToV3LPPositionRequest,
  MigrateV2ToV3LPPositionResponse,
  MigrateV3ToV4LPPositionRequest,
  MigrateV3ToV4LPPositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { FetchClient } from '@universe/api/src/clients/base/types'
import { createFetcher } from '@universe/api/src/clients/base/utils'

export interface LiquidityServiceClientContext {
  fetchClient: FetchClient
}

export interface LiquidityServiceClient {
  migrateV2ToV3LpPosition: (params: MigrateV2ToV3LPPositionRequest) => Promise<MigrateV2ToV3LPPositionResponse>
  migrateV3ToV4LpPosition: (params: MigrateV3ToV4LPPositionRequest) => Promise<MigrateV3ToV4LPPositionResponse>
  claimRewards: (params: ClaimLPRewardsRequest) => Promise<ClaimLPRewardsResponse>
}

export const LIQUIDITY_PATHS = {
  migrateV2ToV3LPPosition: '/MigrateV2ToV3LPPosition',
  migrateV3ToV4LPPosition: '/MigrateV3ToV4LPPosition',
  claimRewards: '/ClaimLPRewards',
}

export function createLiquidityServiceClient(ctx: LiquidityServiceClientContext): LiquidityServiceClient {
  const { fetchClient: client } = ctx

  const migrateV2ToV3LpPosition = createFetcher<MigrateV2ToV3LPPositionRequest, MigrateV2ToV3LPPositionResponse>({
    client,
    url: LIQUIDITY_PATHS.migrateV2ToV3LPPosition,
    method: 'post',
    transformRequest: async ({ params }) => ({
      params: {
        // this needs to be destructured because otherwise the enums get stringified to the key and the backend expects the value.
        ...params,
      },
    }),
  })

  const migrateV3ToV4LpPosition = createFetcher<MigrateV3ToV4LPPositionRequest, MigrateV3ToV4LPPositionResponse>({
    client,
    url: LIQUIDITY_PATHS.migrateV3ToV4LPPosition,
    method: 'post',
    transformRequest: async ({ params }) => ({
      params: {
        // this needs to be destructured because otherwise the enums get stringified to the key and the backend expects the value.
        ...params,
      },
    }),
  })

  const claimRewards = createFetcher<ClaimLPRewardsRequest, ClaimLPRewardsResponse>({
    client,
    url: LIQUIDITY_PATHS.claimRewards,
    method: 'post',
    transformRequest: async ({ params }) => ({
      params: {
        ...params,
      },
    }),
  })

  return {
    migrateV2ToV3LpPosition,
    migrateV3ToV4LpPosition,
    claimRewards,
  }
}
