import { createPromiseClient } from '@connectrpc/connect'
import { AuctionService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_connect'
import { createAuctionQueryClient } from '@universe/api'
import { liquidityServiceTransport } from 'uniswap/src/data/apiClients/liquidityService/base'

// Direct client for imperative auction read calls (non-React)
// For React components, prefer useQuery hooks (useVerifyWalletQuery, etc.)
export const AuctionQueryClient = createAuctionQueryClient({
  rpcClient: createPromiseClient(AuctionService, liquidityServiceTransport),
})
