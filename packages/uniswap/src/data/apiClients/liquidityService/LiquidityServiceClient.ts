import { createPromiseClient } from '@connectrpc/connect'
import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_connect'
import { createLiquidityServiceClient } from '@universe/api'
import { liquidityServiceTransport } from 'uniswap/src/data/apiClients/liquidityService/base'

// Direct client for imperative calls (non-React)
// For React components, use the hooks (useCheckLPApprovalQuery, etc.) instead
export const LiquidityServiceClient = createLiquidityServiceClient({
  rpcClient: createPromiseClient(LiquidityService, liquidityServiceTransport),
})
