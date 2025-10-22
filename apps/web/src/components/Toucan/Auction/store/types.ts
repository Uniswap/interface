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

export enum DisplayMode {
  VALUATION = 'VALUATION',
  TOKEN_PRICE = 'TOKEN_PRICE',
}

interface AuctionState {
  auctionDetails: AuctionDetails | null
  checkpointData: CheckpointData | null
  tokenColor?: string
  displayMode: DisplayMode
}

interface AuctionActions {
  setTokenColor: (color?: string) => void
  setDisplayMode: (mode: DisplayMode) => void
}

export type AuctionStoreState = AuctionState & {
  actions: AuctionActions
}
