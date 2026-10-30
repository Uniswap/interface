import type { PlainMessage } from '@bufbuild/protobuf'
import { Auction, Checkpoint, TickDetail } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { EVMUniverseChainId } from '@universe/chains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { ChartMode } from '~/features/Toucan/ToucanChart/renderer'

export type BidDistributionData = Map<string, string>

export enum AuctionLockMode {
  Timelock = 'TIMELOCK',
  FeesForwarder = 'FEES_FORWARDER',
  BuybackBurn = 'BUYBACK_BURN',
  Burn = 'BURN',
}

/**
 * Liquidity-lock metadata (`data.v1.LiquidityLockInfo`) for auctions whose graduated LP position
 * is held by a timelock recipient contract.
 *
 * `Auction.liquidity_lock` is published in `@uniswap/client-data-api` as of 0.0.124, but this
 * local widening remains deliberate: auction data reaches the store via an unchecked cast (see
 * useLoadAuctionDetails), so every field stays optional and the enum/uint64 fields accept both
 * wire shapes (string names / numbers) — `useAuctionLiquidityLock` normalizes them. It also
 * carries `lockedForever`, which ships in 0.0.125 (not yet in 0.0.124).
 */
export interface AuctionLiquidityLockInfo {
  /** Lock recipient contract address (the burn address for burn-mode locks). Presence means the LP position is locked. */
  lockRecipient?: string
  /** Proto enum — may arrive as a number (1|2|3|4) or a string name depending on serialization. */
  lockMode?: number | string
  /** Unlock block number. The FE estimates the calendar date (no unlock timestamp is served). */
  unlockBlock?: string | number | bigint
  /**
   * True when the lock can never unlock: burn-mode locks (`LOCK_MODE_BURN`) and legacy
   * max-int "Permanent" timelocks. Added in `@uniswap/client-data-api` 0.0.125
   * (Uniswap/backend#10276/#10277). When set, `unlockBlock` is meaningless (0 for burn)
   * and must be ignored.
   */
  lockedForever?: boolean
  /** Timelock operator — displayed as "LP owner" while locked. */
  lpOperator?: string
  /** Fee recipient — present in fees-forwarder mode only. */
  feeRecipient?: string
  /** Per-burn floor in raw base units — buyback-burn mode only. */
  minTokenBurnAmount?: string
  /**
   * Cumulative tokens bought back & burned, raw base units.
   * USD value is computed frontend-side at the current token price (disclosed to the user).
   */
  totalTokensBurned?: string
}

export interface AuctionDetails extends Omit<Auction, 'chainId' | 'liquidityLock'> {
  // Override chainId to use EVMUniverseChainId for type safety
  chainId: EVMUniverseChainId
  // Auction token info (the token being auctioned off via tokenAddress)
  // Includes: tokenSymbol, tokenName, tokenDecimals, and optional logoUrl
  token?: CurrencyInfo
  // Pre-bidding end block derived from parsedAuctionSteps
  preBidEndBlock?: string
  // Liquidity-lock metadata — overrides the generated `LiquidityLockInfo` message type with the
  // widened wire-shape form (see AuctionLiquidityLockInfo). Absence means "not locked".
  liquidityLock?: AuctionLiquidityLockInfo
  // poolOwner (unlocked "LP owner" display) is inherited from the generated Auction type
  // (served since client-data-api 0.0.124; unset until migration params are indexed).
  // Launched-token metadata (tokenImageUrl / tokenDescription / xHandle, fields 40-42 on
  // `data.v1.Auction`) is inherited from the generated Auction type. It is unset (not empty
  // string) while a newly launched token's metadata is pending moderation, so all consumers
  // must handle absence gracefully.
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

/**
 * Explicit post-auction outcome, derived from progress state + graduation.
 * There is no failure flag on-chain or in the API — a failed launch is simply
 * an ended auction that never met its graduation criteria.
 */
export enum AuctionOutcome {
  // Progress not computable yet (missing block or auction data)
  UNKNOWN = 'UNKNOWN',
  // Auction has not ended yet (not started or in progress)
  ACTIVE = 'ACTIVE',
  // Ended and raised at least requiredCurrencyRaised
  GRADUATED = 'GRADUATED',
  // Ended without meeting graduation criteria (failed launch)
  FAILED = 'FAILED',
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
 * Load state for `GetLatestCheckpoint`, alongside `checkpointData`.
 *
 * `checkpointData: null` on its own cannot distinguish "the request is still in the air" from
 * "the request came back and there was nothing in it" — and those demand opposite treatment when
 * classifying an ended auction. The line that matters is *settled* vs *in flight*, so it gets its
 * own field rather than being inferred from the payload.
 *
 * Only `Success` is authoritative about absence. `Error` never is: `GetLatestCheckpoint` answers
 * 404 for an address it cannot resolve to an auction (a token address, say), which says nothing
 * about whether the auction raised anything.
 */
export enum AuctionCheckpointLoadState {
  /** Nothing requested yet — no chainId/address, so the query's `enabled` gate is holding it. */
  Idle = 'IDLE',
  /** In flight, including the bounded retries. */
  Loading = 'LOADING',
  /** Resolved. `checkpointData === null` now means the response genuinely carried no checkpoint. */
  Success = 'SUCCESS',
  /** Settled as a failure after its retries — transport error, or a 404 from an unresolvable address. */
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
  /**
   * Whether the graduation threshold was met — `undefined` while undecided (checkpoint not
   * settled, or either side of the comparison missing/malformed). This is the honest arity;
   * prefer it, or `outcome`, over `isGraduated`.
   */
  hasMetThreshold?: boolean
  /**
   * Lossy convenience view of `hasMetThreshold`, kept for the existing boolean consumers.
   * Fails closed: also false while graduation is undecided, so `!isGraduated` does NOT mean
   * "failed" — it means "not known to have graduated". Never derive user-visible failure copy
   * from it; branch on `outcome === AuctionOutcome.FAILED` (or read `hasMetThreshold`) instead.
   */
  isGraduated: boolean
  outcome: AuctionOutcome
  /**
   * An ended auction whose final checkpoint has not loaded. A served verdict can settle `outcome`
   * first, but GetAuction's clearing price can lag the final one, so anything priced off
   * `getClearingPrice` waits on this rather than reading the fallback.
   */
  isFinalPricePending: boolean
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
  checkpointData: PlainMessage<Checkpoint> | null
  /**
   * Whether the checkpoint request has settled, and how. Read together with `checkpointData` to
   * tell an unresolved checkpoint from one that resolved empty — polling stops once the auction
   * leaves IN_PROGRESS, so a null checkpoint on an ended auction is otherwise permanent and
   * indistinguishable from a slow first load.
   */
  checkpointLoadState: AuctionCheckpointLoadState
  onchainCheckpoint: PlainMessage<Checkpoint> | null // For bid in-range detection only
  // Live total tokens cleared, from GetLatestCheckpointResponse.total_cleared (response-level,
  // always-populated). Checkpoint.totalCleared (proto field 13) is deprecated — don't read it.
  totalCleared: string | null
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
  // Initialized-tick details from GetTickDetails API (sorted ascending by priceQ96).
  // Null until first load; empty array means the auction has no initialized ticks.
  tickDetails: PlainMessage<TickDetail>[] | null
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
  // Bid selected from chart marker click (used to open BidDetailsModal from the chart)
  chartSelectedBid: { bidId: string; isInRange: boolean } | null
  // Whether any bid input field is currently focused (used to show/hide concentration band)
  isBidInputFocused: boolean
  // On-chain `sweepUnsoldTokensBlock()` from the auction contract (one-shot latch: '0' until the
  // creator sweeps unsold tokens, then the sweep block). undefined until the chain read resolves.
  sweepUnsoldTokensBlock: string | undefined
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
  setCheckpointData: (data: PlainMessage<Checkpoint> | null) => void
  setCheckpointLoadState: (state: AuctionCheckpointLoadState) => void
  setOnchainCheckpoint: (data: PlainMessage<Checkpoint> | null) => void
  setTotalCleared: (totalCleared: string | null) => void
  setSelectedTickPrice: (price: string | null) => void
  setUserBidPrice: (price: string | null) => void
  setCustomBidTick: (tickValue: number | null) => void
  setConcentrationBand: (band: ConcentrationBand | null) => void
  setBidDistributionData: (data: BidDistributionData | null, excludedVolume?: string | null) => void
  setTickDetails: (ticks: PlainMessage<TickDetail>[] | null) => void
  setRefetchUserBids: (refetchFn: (() => void) | null) => void
  setActiveBidFormTab: (tab: BidInfoTab) => void
  setOptimisticBid: (bid: OptimisticBid | null) => void
  setPreviousBidsCount: (count: number) => void
  setChartSelectedBid: (bid: { bidId: string; isInRange: boolean } | null) => void
  // Per-bid withdrawal state management
  addPendingWithdrawalBid: (bidId: string, txHash: string) => void
  removePendingWithdrawalBid: (bidId: string) => void
  addAwaitingConfirmationBid: (bidId: string) => void
  removeAwaitingConfirmationBid: (bidId: string) => void
  clearAllWithdrawalStateForBid: (bidId: string) => void
  clearAllWithdrawalState: () => void
  setBidInputFocused: (focused: boolean) => void
  setSweepUnsoldTokensBlock: (block: string | undefined) => void
}

export type AuctionStoreState = AuctionState & {
  actions: AuctionActions
}
