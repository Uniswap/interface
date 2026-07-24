import { type PartialMessage } from '@bufbuild/protobuf'
import { type PromiseClient } from '@connectrpc/connect'
import { type AuctionService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_connect'
import type {
  CreateAuctionRequest,
  CreateAuctionResponse,
  ExitBidAndClaimTokensRequest,
  ExitBidAndClaimTokensResponse,
  ExitBidPositionRequest,
  ExitBidPositionResponse,
  SubmitBidRequest,
  SubmitBidResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'

interface AuctionMutationClientContext {
  rpcClient: PromiseClient<typeof AuctionService>
}

export interface AuctionMutationClient {
  createAuction: (params: PartialMessage<CreateAuctionRequest>) => Promise<CreateAuctionResponse>
  submitBid: (params: PartialMessage<SubmitBidRequest>) => Promise<SubmitBidResponse>
  exitBidAndClaimTokens: (
    params: PartialMessage<ExitBidAndClaimTokensRequest>,
  ) => Promise<ExitBidAndClaimTokensResponse>
  exitBidPosition: (params: PartialMessage<ExitBidPositionRequest>) => Promise<ExitBidPositionResponse>
}

export function createAuctionMutationClient({ rpcClient }: AuctionMutationClientContext): AuctionMutationClient {
  return {
    createAuction: (params) => rpcClient.createAuction(params),
    submitBid: (params) => rpcClient.submitBid(params),
    exitBidAndClaimTokens: (params) => rpcClient.exitBidAndClaimTokens(params),
    exitBidPosition: (params) => rpcClient.exitBidPosition(params),
  }
}
