import { PromiseClient } from '@connectrpc/connect'
import { AuctionService } from '@uniswap/client-data-api/dist/data/v1/auction_connect'
import {
  GetAuctionActivityRequest,
  GetAuctionActivityResponse,
  GetAuctionRequest,
  GetAuctionResponse,
  GetBidsByWalletRequest,
  GetBidsByWalletResponse,
  GetBidsRequest,
  GetBidsResponse,
  GetClearingPriceHistoryRequest,
  GetClearingPriceHistoryResponse,
  GetLatestCheckpointRequest,
  GetLatestCheckpointResponse,
  ListTopAuctionsRequest,
  ListTopAuctionsResponse,
} from '@uniswap/client-data-api/dist/data/v1/auction_pb'

interface AuctionServiceClientContext {
  rpcClient: PromiseClient<typeof AuctionService>
}

export interface AuctionServiceClient {
  getAuction: (params: GetAuctionRequest) => Promise<GetAuctionResponse>
  getAuctionActivity: (params: GetAuctionActivityRequest) => Promise<GetAuctionActivityResponse>
  getBids: (params: GetBidsRequest) => Promise<GetBidsResponse>
  getBidsByWallet: (params: GetBidsByWalletRequest) => Promise<GetBidsByWalletResponse>
  getClearingPriceHistory: (params: GetClearingPriceHistoryRequest) => Promise<GetClearingPriceHistoryResponse>
  getLatestCheckpoint: (params: GetLatestCheckpointRequest) => Promise<GetLatestCheckpointResponse>
  listTopAuctions: (params: ListTopAuctionsRequest) => Promise<ListTopAuctionsResponse>
}

export function createAuctionServiceClient({ rpcClient }: AuctionServiceClientContext): AuctionServiceClient {
  return {
    getAuction: (params) => rpcClient.getAuction(params),
    getAuctionActivity: (params) => rpcClient.getAuctionActivity(params),
    getBids: (params) => rpcClient.getBids(params),
    getBidsByWallet: (params) => rpcClient.getBidsByWallet(params),
    getClearingPriceHistory: (params) => rpcClient.getClearingPriceHistory(params),
    getLatestCheckpoint: (params) => rpcClient.getLatestCheckpoint(params),
    listTopAuctions: (params) => rpcClient.listTopAuctions(params),
  }
}
