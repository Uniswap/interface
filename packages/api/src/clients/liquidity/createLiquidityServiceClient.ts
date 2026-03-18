import { type PromiseClient } from '@connectrpc/connect'
import { type LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_connect'
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
  GetLPPriceDiscrepancyRequest,
  GetLPPriceDiscrepancyResponse,
  IncreaseLPPositionRequest,
  IncreaseLPPositionResponse,
  MigrateV2ToV3LPPositionRequest,
  MigrateV2ToV3LPPositionResponse,
  MigrateV3ToV4LPPositionRequest,
  MigrateV3ToV4LPPositionResponse,
  PoolInfoRequest,
  PoolInfoResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'

interface LiquidityServiceClientContext {
  rpcClient: PromiseClient<typeof LiquidityService>
}

export interface LiquidityServiceClient {
  checkApproval: (params: CheckApprovalLPRequest) => Promise<CheckApprovalLPResponse>
  claimLpFees: (params: ClaimLPFeesRequest) => Promise<ClaimLPFeesResponse>
  claimRewards: (params: ClaimLPRewardsRequest) => Promise<ClaimLPRewardsResponse>
  createLpPosition: (params: CreateLPPositionRequest) => Promise<CreateLPPositionResponse>
  decreaseLpPosition: (params: DecreaseLPPositionRequest) => Promise<DecreaseLPPositionResponse>
  getLPPriceDiscrepancy: (params: GetLPPriceDiscrepancyRequest) => Promise<GetLPPriceDiscrepancyResponse>
  increaseLpPosition: (params: IncreaseLPPositionRequest) => Promise<IncreaseLPPositionResponse>
  migrateV2ToV3LpPosition: (params: MigrateV2ToV3LPPositionRequest) => Promise<MigrateV2ToV3LPPositionResponse>
  migrateV3ToV4LpPosition: (params: MigrateV3ToV4LPPositionRequest) => Promise<MigrateV3ToV4LPPositionResponse>
  poolInfo: (params: PoolInfoRequest) => Promise<PoolInfoResponse>
}

export function createLiquidityServiceClient({ rpcClient }: LiquidityServiceClientContext): LiquidityServiceClient {
  return {
    checkApproval: (params) => rpcClient.checkLPApproval(params),
    claimLpFees: (params) => rpcClient.claimLPFees(params),
    claimRewards: (params) => rpcClient.claimLPRewards(params),
    createLpPosition: (params) => rpcClient.createLPPosition(params),
    decreaseLpPosition: (params) => rpcClient.decreaseLPPosition(params),
    getLPPriceDiscrepancy: (params) => rpcClient.getLPPriceDiscrepancy(params),
    increaseLpPosition: (params) => rpcClient.increaseLPPosition(params),
    migrateV2ToV3LpPosition: (params) => rpcClient.migrateV2ToV3LPPosition(params),
    migrateV3ToV4LpPosition: (params) => rpcClient.migrateV3ToV4LPPosition(params),
    poolInfo: (params) => rpcClient.poolInfo(params),
  }
}
