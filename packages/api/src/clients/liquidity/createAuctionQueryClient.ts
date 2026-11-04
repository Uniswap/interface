import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type AuctionService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_connect'
import type {
  ValidateAuctionHookRequest,
  ValidateAuctionHookResponse,
  VerifyWalletRequest,
  VerifyWalletResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'

interface AuctionQueryClientContext {
  rpcClient: PromiseClient<typeof AuctionService>
}

export interface AuctionQueryClient {
  validateAuctionHook: (params: PartialMessage<ValidateAuctionHookRequest>) => Promise<ValidateAuctionHookResponse>
  verifyWallet: (params: PartialMessage<VerifyWalletRequest>) => Promise<VerifyWalletResponse>
}

export function createAuctionQueryClient({ rpcClient }: AuctionQueryClientContext): AuctionQueryClient {
  return {
    validateAuctionHook: (params) => rpcClient.validateAuctionHook(params),
    verifyWallet: (params) => rpcClient.verifyWallet(params),
  }
}
