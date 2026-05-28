import { createPromiseClient } from '@connectrpc/connect'
import { LiquidityService as V1LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_connect'
import { LiquidityService as V2LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { createV1LiquidityServiceClient, createV2LiquidityServiceClient } from '@universe/api'
import { liquidityServiceTransport } from 'uniswap/src/data/apiClients/liquidityService/base'

// Direct client for imperative calls (non-React)
// For React components, use the hooks (useCheckLPApprovalQuery, etc.) instead
export const V1LiquidityServiceClient = createV1LiquidityServiceClient({
  rpcClient: createPromiseClient(V1LiquidityService, liquidityServiceTransport),
})

export const V2LiquidityServiceClient = createV2LiquidityServiceClient({
  rpcClient: createPromiseClient(V2LiquidityService, liquidityServiceTransport),
})
