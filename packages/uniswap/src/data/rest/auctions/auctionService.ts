/**
 * TODO | Toucan: Remove these stubs once backend endpoints are available
 * Stubbed auction service methods
 *
 * These are temporary function stubs that throw errors. When the backend generates
 * the actual connect-query service, replace this entire file with a single line:
 * example:
 * export * from '@uniswap/client-data-api/dist/data/v1/api-AuctionService_connectquery'
 *
 * That will provide the real service methods with proper protobuf Message types.
 */

import type {
  GetAuctionDetailsRequest,
  GetAuctionDetailsResponse,
  GetAuctionsRequest,
  GetAuctionsResponse,
  GetBidConcentrationRequest,
  GetBidConcentrationResponse,
  GetBidsByWalletRequest,
  GetBidsByWalletResponse,
  GetLatestCheckpointRequest,
  GetLatestCheckpointResponse,
} from 'uniswap/src/data/rest/auctions/types'

export async function getAuctions(_input?: GetAuctionsRequest): Promise<GetAuctionsResponse> {
  throw new Error('AuctionService.getAuctions: Not implemented - awaiting backend endpoint')
}

export async function getBidsByWallet(_input: GetBidsByWalletRequest): Promise<GetBidsByWalletResponse> {
  throw new Error('AuctionService.getBidsByWallet: Not implemented - awaiting backend endpoint')
}

export async function getBidConcentration(_input: GetBidConcentrationRequest): Promise<GetBidConcentrationResponse> {
  throw new Error('AuctionService.getBidConcentration: Not implemented - awaiting backend endpoint')
}

export async function getAuctionDetails(_input: GetAuctionDetailsRequest): Promise<GetAuctionDetailsResponse> {
  throw new Error('AuctionService.getAuctionDetails: Not implemented - awaiting backend endpoint')
}

export async function getLatestCheckpoint(_input: GetLatestCheckpointRequest): Promise<GetLatestCheckpointResponse> {
  throw new Error('AuctionService.getLatestCheckpoint: Not implemented - awaiting backend endpoint')
}
