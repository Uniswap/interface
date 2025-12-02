import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'

// potentially missing clearing price
export interface AuctionDetails {
  auctionId: string
  chainId: EVMUniverseChainId
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

export enum AuctionProgressState {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ENDED = 'ENDED',
}

/**
 * Computed auction progress information
 * These fields are automatically updated when currentBlockNumber changes
 */
export interface AuctionProgressData {
  state: AuctionProgressState
  blocksRemaining: number | undefined
  progressPercentage: number | undefined
  isGraduated: boolean
}

interface AuctionState {
  auctionDetails: AuctionDetails | null
  checkpointData: CheckpointData | null
  tokenColor?: string
  displayMode: DisplayMode
  currentBlockNumber: bigint | undefined
  progress: AuctionProgressData
}

interface AuctionActions {
  setTokenColor: (color?: string) => void
  setDisplayMode: (mode: DisplayMode) => void
  setCurrentBlockNumberAndUpdateProgress: (blockNumber: bigint | undefined) => void
}

export type AuctionStoreState = AuctionState & {
  actions: AuctionActions
}
