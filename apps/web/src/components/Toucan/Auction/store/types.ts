import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'

export type BidDistributionData = Map<string, string>

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
  // TODO | Toucan: remove once token details are fetched using address
  tokenDecimals: number // Token decimals for totalSupply conversion
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

// TODO | Toucan - determine if this can be replaced with SDK Token type
/**
 * Bid token metadata used for chart calculations
 * Note: priceFiat is fetched in USD from on-chain stablecoin data.
 * Multi-currency display is handled at the component layer via useFiatConverter.
 */
export interface BidTokenInfo {
  symbol: string
  decimals: number
  /** Token price in USD - converted to user's selected fiat currency at display time */
  priceFiat: number
}

// Chart zoom state for tracking visible range and zoom status
interface ChartZoomState {
  visibleRange: { from: number; to: number } | null
  isZoomed: boolean
}

interface AuctionState {
  auctionDetails: AuctionDetails | null
  checkpointData: CheckpointData | null
  tokenColor?: string
  displayMode: DisplayMode
  currentBlockNumber: bigint | undefined
  progress: AuctionProgressData
  chartZoomState: ChartZoomState
}

interface AuctionActions {
  setTokenColor: (color?: string) => void
  setDisplayMode: (mode: DisplayMode) => void
  setCurrentBlockNumberAndUpdateProgress: (blockNumber: bigint | undefined) => void
  setChartZoomState: (state: ChartZoomState) => void
  resetChartZoom: () => void
}

export type AuctionStoreState = AuctionState & {
  actions: AuctionActions
}
