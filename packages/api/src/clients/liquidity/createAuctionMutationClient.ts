import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type AuctionService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_connect'
import type {
  ExitBidAndClaimTokensRequest,
  ExitBidAndClaimTokensResponse,
  ExitBidPositionRequest,
  ExitBidPositionResponse,
  SubmitBidRequest,
  SubmitBidResponse,
  TokenCountAllocatedToLpForAuctionRequest,
  TokenCountAllocatedToLpForAuctionResponse,
  VerifyWalletRequest,
  VerifyWalletResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'

interface AuctionMutationClientContext {
  rpcClient: PromiseClient<typeof AuctionService>
}

export interface AuctionMutationClient {
  submitBid: (params: PartialMessage<SubmitBidRequest>) => Promise<SubmitBidResponse>
  exitBidAndClaimTokens: (
    params: PartialMessage<ExitBidAndClaimTokensRequest>,
  ) => Promise<ExitBidAndClaimTokensResponse>
  exitBidPosition: (params: PartialMessage<ExitBidPositionRequest>) => Promise<ExitBidPositionResponse>
  tokenCountAllocatedToLpForAuction: (
    params: PartialMessage<TokenCountAllocatedToLpForAuctionRequest>,
  ) => Promise<TokenCountAllocatedToLpForAuctionResponse>
  verifyWallet: (params: PartialMessage<VerifyWalletRequest>) => Promise<VerifyWalletResponse>
}

export function createAuctionMutationClient({ rpcClient }: AuctionMutationClientContext): AuctionMutationClient {
  return {
    submitBid: (params) => rpcClient.submitBid(params),
    exitBidAndClaimTokens: (params) => rpcClient.exitBidAndClaimTokens(params),
    exitBidPosition: (params) => rpcClient.exitBidPosition(params),
    tokenCountAllocatedToLpForAuction: (params) => rpcClient.tokenCountAllocatedToLpForAuction(params),
    verifyWallet: (params) => rpcClient.verifyWallet(params),
  }
}
