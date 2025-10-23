import { UniverseChainId } from 'uniswap/src/features/chains/types'

// potentially missing clearing price
export interface AuctionDetails {
  auctionId: string
  chainId: UniverseChainId
  tokenSymbol: string
  tokenAddress: string
  tokenName: string // this is missing from what Rob sent
  logoUrl: string // this is missing from what Rob sent
  creatorAddress: string
  startBlock: number
  endBlock: number
  totalSupply: string
  tickSize: string
  graduationThreshold: number
  bidTokenAddress: string
}

export interface CheckpointData {
  clearingPrice: string
  cumulativeMps: number
}

interface AuctionState {
  auctionDetails: AuctionDetails | null
  checkpointData: CheckpointData | null
  tokenColor?: string
}

interface AuctionActions {
  setTokenColor: (color?: string) => void
}

export type AuctionStoreState = AuctionState & {
  actions: AuctionActions
}
