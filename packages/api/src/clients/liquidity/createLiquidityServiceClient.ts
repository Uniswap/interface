import { type PromiseClient } from '@connectrpc/connect'
import { type LiquidityService as V1LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_connect'
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
import { type LiquidityService as V2LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
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

interface V1LiquidityServiceClientContext {
  rpcClient: PromiseClient<typeof V1LiquidityService>
}

export interface V1LiquidityServiceClient {
  claimRewards: (params: ClaimLPRewardsRequest) => Promise<ClaimLPRewardsResponse>
  migrateV2ToV3LpPosition: (params: MigrateV2ToV3LPPositionRequest) => Promise<MigrateV2ToV3LPPositionResponse>
  migrateV3ToV4LpPosition: (params: MigrateV3ToV4LPPositionRequest) => Promise<MigrateV3ToV4LPPositionResponse>
  poolInfo: (params: PoolInfoRequest) => Promise<PoolInfoResponse>
}

export function createV1LiquidityServiceClient({
  rpcClient,
}: V1LiquidityServiceClientContext): V1LiquidityServiceClient {
  return {
    claimRewards: (params) => rpcClient.claimLPRewards(params),
    migrateV2ToV3LpPosition: (params) => rpcClient.migrateV2ToV3LPPosition(params),
    migrateV3ToV4LpPosition: (params) => rpcClient.migrateV3ToV4LPPosition(params),
    poolInfo: (params) => rpcClient.poolInfo(params),
  }
}

interface V2LiquidityServiceClientContext {
  rpcClient: PromiseClient<typeof V2LiquidityService>
}

export interface V2LiquidityServiceClient {
  checkLPApproval: (params: LPApprovalRequest) => Promise<LPApprovalResponse>
  claimFees: (params: ClaimFeesRequest) => Promise<ClaimFeesResponse>
  createClassicPosition: (params: CreateClassicPositionRequest) => Promise<CreateClassicPositionResponse>
  createPosition: (params: CreatePositionRequest) => Promise<CreatePositionResponse>
  decreasePosition: (params: DecreasePositionRequest) => Promise<DecreasePositionResponse>
  increasePosition: (params: IncreasePositionRequest) => Promise<IncreasePositionResponse>
}

export function createV2LiquidityServiceClient({
  rpcClient,
}: V2LiquidityServiceClientContext): V2LiquidityServiceClient {
  return {
    checkLPApproval: (params) => rpcClient.checkLPApproval(params),
    claimFees: (params) => rpcClient.claimFees(params),
    createClassicPosition: (params) => rpcClient.createClassicPosition(params),
    createPosition: (params) => rpcClient.createPosition(params),
    decreasePosition: (params) => rpcClient.decreasePosition(params),
    increasePosition: (params) => rpcClient.increasePosition(params),
  }
}
