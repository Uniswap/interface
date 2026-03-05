import { Auction, Checkpoint } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { ChartMode } from '~/components/Charts/ToucanChart/renderer'

export type BidDistributionData = Map<string, string>

export interface AuctionDetails extends Omit<Auction, 'chainId'> {
  // Override chainId to use EVMUniverseChainId for type safety
  chainId: EVMUniverseChainId
  // Auction token info (the token being auctioned off via tokenAddress)
  // Includes: tokenSymbol, tokenName, tokenDecimals, and optional logoUrl
  token?: CurrencyInfo
  // Pre-bidding end block derived from parsedAuctionSteps
  preBidEndBlock?: string
}

export enum AuctionBidStatus {
  Submitted = 'submitted',
  Exited = 'exited',
  Claimed = 'claimed',
}

export interface UserBid {
  bidId: string
  auctionId: string
  walletId: string
  txHash: string
  amount: string // Tokens filled (Wei amount as string)
  maxPrice: string // Wei amount as string (Q96 format)
  createdAt: string // ISO timestamp
  status: AuctionBidStatus
  baseTokenInitial: string // Initial bid amount (Wei amount as string)
  currencySpent: string // Currency spent on bid
}

/**
 * Optimistic bid data for immediate UI feedback after bid submission.
 * Displayed while waiting for API to confirm the new bid.
 */
export interface OptimisticBid {
  maxPriceQ96: string // Q96 format max price
  budgetRaw: string // Budget in wei
  bidTokenDecimals: number // For formatting
  bidTokenSymbol: string // e.g., "ETH"
  submittedAt: number // Date.now() for "Just now" display
  txHash: string // Transaction hash for monitoring status
}

export enum AuctionProgressState {
  UNKNOWN = 'UNKNOWN',
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ENDED = 'ENDED',
}

export enum BidInfoTab {
  PLACE_A_BID = 'placeABid',
  MY_BIDS = 'myBids',
  AUCTION_GRADUATED = 'auctionGraduated',
}

export enum AuctionDetailsLoadState {
  Idle = 'IDLE',
  Loading = 'LOADING',
  Success = 'SUCCESS',
  NotFound = 'NOT_FOUND',
  Error = 'ERROR',
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
 * priceFiat is 0 when price data is unavailable (e.g., testnets without price feeds)
 */
export interface BidTokenInfo {
  symbol: string
  decimals: number
  priceFiat: number
  isStablecoin: boolean
  logoUrl: Maybe<string>
}

// Chart zoom state for tracking visible range and zoom status
export interface ChartZoomState {
  visibleRange: { from: number; to: number } | null
  isZoomed: boolean
}

// Separate zoom states per chart mode (distribution vs demand)
type ChartZoomStates = Record<ChartMode, ChartZoomState>

type AuctionChartZoomTarget = ChartMode | 'clearingPrice'

interface AuctionChartZoomCommand {
  target: AuctionChartZoomTarget
  action: 'zoomIn' | 'zoomOut' | 'reset'
}

interface TickGroupingState {
  groupSizeTicks: number
  medianOffsetTicks: number
}

// Custom bid tick state for rendering out-of-range bids on the chart
// When a user clicks the out-of-range indicator, this tick is added to chart data
// so the x-axis can extend to show the bid
interface CustomBidTickState {
  tickValue: number | null // The tick value to render (in decimal form)
}

// Concentration band for zoom functionality
interface ConcentrationBand {
  startIndex: number
  endIndex: number
  startTick: number
  endTick: number
  startTickQ96: string
  endTickQ96: string
  percentage: number // Percentage of total bid volume (0-1)
}

interface AuctionState {
  auctionAddress?: string
  chainId?: EVMUniverseChainId
  auctionDetails: AuctionDetails | null
  auctionDetailsLoadState: AuctionDetailsLoadState
  auctionDetailsError: string | null
  checkpointData: Checkpoint | null
  onchainCheckpoint: Checkpoint | null // For bid in-range detection only
  tokenColor?: string
  tokenColorLoading: boolean
  currentBlockNumber: number | undefined
  progress: AuctionProgressData
  chartZoomStates: ChartZoomStates
  clearingPriceZoomState: ChartZoomState
  chartZoomCommand: AuctionChartZoomCommand | null
  /** Whether the bid distribution chart should render grouped tick bars + grouped snapping behavior. */
  groupTicksEnabled: boolean
  tickGrouping: TickGroupingState | null
  /** Counter incremented to force chart hover state reset when mouse leaves the chart. */
  chartHoverResetKey: number
  userBids: UserBid[]
  // Whether the initial user bids fetch has completed (used to avoid tab flash on load)
  userBidsInitialized: boolean
  // Price selected from chart click (in raw decimal format, not Q96)
  selectedTickPrice: string | null
  // User's current bid price from max valuation input (in decimal format)
  // Used to render the bid line on the chart
  userBidPrice: string | null
  // Custom bid tick to render on chart when bid is out of GetBids data range
  // Set when user clicks out-of-range indicator to navigate to their bid
  customBidTick: CustomBidTickState
  // Concentration band for the chart, used for reset zoom
  concentrationBand: ConcentrationBand | null
  // Bid distribution data from GetBids API - shared across components
  bidDistributionData: BidDistributionData | null
  // Volume from bids excluded due to MAX_RENDERABLE_BARS cap (stored as raw string)
  excludedBidVolume: string | null
  // Callback to manually refetch user bids (used after withdrawal transactions)
  refetchUserBids: (() => void) | null
  // Active tab in BidFormTabs - used to conditionally show bid line on chart
  activeBidFormTab: BidInfoTab
  // Optimistic bid for immediate UI feedback after bid submission
  optimisticBid: OptimisticBid | null
  // Previous bids count for detecting when API returns new bid
  previousBidsCount: number
  // Per-bid tracking of withdrawal state - bidIds that are pending or awaiting confirmation
  // Using Sets enables multiple concurrent withdrawals without blocking other bids
  pendingWithdrawalBidIds: Set<string>
  awaitingConfirmationBidIds: Set<string>
  // Maps bidId -> txHash for tracking which transaction each bid is associated with
  withdrawalTxHashes: Map<string, string>
}

interface AuctionActions {
  setTokenColor: (color?: string) => void
  setTokenColorLoading: (loading: boolean) => void
  setUserBids: (userBids: UserBid[]) => void
  setUserBidsInitialized: (initialized: boolean) => void
  setCurrentBlockNumberAndUpdateProgress: (blockNumber: number | undefined) => void
  setChartZoomState: (chartMode: ChartMode, state: ChartZoomState) => void
  setClearingPriceZoomState: (state: ChartZoomState) => void
  requestChartZoom: (target: AuctionChartZoomTarget, action: AuctionChartZoomCommand['action']) => void
  clearChartZoomCommand: () => void
  setGroupTicksEnabled: (enabled: boolean) => void
  setTickGrouping: (grouping: TickGroupingState | null) => void
  incrementChartHoverResetKey: () => void
  resetChartZoom: (chartMode?: ChartMode) => void
  setAuctionDetails: (details: AuctionDetails | null) => void
  setAuctionDetailsLoadState: (state: AuctionDetailsLoadState, error?: string | null) => void
  setCheckpointData: (data: Checkpoint | null) => void
  setOnchainCheckpoint: (data: Checkpoint | null) => void
  setSelectedTickPrice: (price: string | null) => void
  setUserBidPrice: (price: string | null) => void
  setCustomBidTick: (tickValue: number | null) => void
  setConcentrationBand: (band: ConcentrationBand | null) => void
  setBidDistributionData: (data: BidDistributionData | null, excludedVolume?: string | null) => void
  setRefetchUserBids: (refetchFn: (() => void) | null) => void
  setActiveBidFormTab: (tab: BidInfoTab) => void
  setOptimisticBid: (bid: OptimisticBid | null) => void
  setPreviousBidsCount: (count: number) => void
  // Per-bid withdrawal state management
  addPendingWithdrawalBid: (bidId: string, txHash: string) => void
  removePendingWithdrawalBid: (bidId: string) => void
  addAwaitingConfirmationBid: (bidId: string) => void
  removeAwaitingConfirmationBid: (bidId: string) => void
  clearAllWithdrawalStateForBid: (bidId: string) => void
  clearAllWithdrawalState: () => void
}

export type AuctionStoreState = AuctionState & {
  actions: AuctionActions
}
