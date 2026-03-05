import { createPromiseClient } from '@connectrpc/connect'
import { AuctionService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_connect'
import { createAuctionMutationClient } from '@universe/api'
import { liquidityServiceTransport } from 'uniswap/src/data/apiClients/liquidityService/base'

// Direct client for imperative auction mutation calls (non-React)
// For React components, use the mutation hooks (useSubmitBidMutation, useExitBidAndClaimTokensMutation) instead
export const AuctionMutationClient = createAuctionMutationClient({
  rpcClient: createPromiseClient(AuctionService, liquidityServiceTransport),
})
