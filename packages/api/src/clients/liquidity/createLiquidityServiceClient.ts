import type {
  MigrateV2ToV3LPPositionRequest,
  MigrateV2ToV3LPPositionResponse,
} from '@uniswap/client-trading/dist/trading/v1/api_pb'
import { FetchClient } from '@universe/api/src/clients/base/types'
import { createFetcher } from '@universe/api/src/clients/base/utils'

export interface LiquidityServiceClientContext {
  fetchClient: FetchClient
}

export interface LiquidityServiceClient {
  migrateV2ToV3LpPosition: (params: MigrateV2ToV3LPPositionRequest) => Promise<MigrateV2ToV3LPPositionResponse>
}

export const LIQUIDITY_PATHS = {
  migrateV2ToV3LPPosition: '/MigrateV2ToV3LPPosition',
}

export function createLiquidityServiceClient(ctx: LiquidityServiceClientContext): LiquidityServiceClient {
  const { fetchClient: client } = ctx

  const migrateV2ToV3LpPosition = createFetcher<MigrateV2ToV3LPPositionRequest, MigrateV2ToV3LPPositionResponse>({
    client,
    url: LIQUIDITY_PATHS.migrateV2ToV3LPPosition,
    method: 'post',
    transformRequest: async ({ params }) => ({
      params: {
        ...params,
      },
    }),
  })

  return {
    migrateV2ToV3LpPosition,
  }
}
