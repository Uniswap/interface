import { MIN_LP_ALLOCATION_PERCENT, NEW_TOKEN_DECIMALS } from '@uniswap/liquidity-launcher-sdk'
import { type Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { FeeData } from 'uniswap/src/features/positions/types'
import type { TokenAccentHex } from '~/pages/Liquidity/CreateAuction/tokenAccentHex'

/**
 * Placeholder address for a token that is being created and does not have an address yet.
 * Must not be ZERO_ADDRESS (native token). Do not use for API lookups or pool fetches.
 */
export const NEW_TOKEN_PLACEHOLDER_ADDRESS = '0x0000000000000000000000000000000000000001'
// Sourced from the launcher SDK (the factory mints new tokens at this decimals); re-exported so
// existing importers keep working off a single source of truth.
export { NEW_TOKEN_DECIMALS }
/** Customizable total-supply bounds for new tokens, in whole tokens (pre-decimals). LP-960. */
export const NEW_TOKEN_MIN_TOTAL_SUPPLY = 1_000_000
export const NEW_TOKEN_MAX_TOTAL_SUPPLY = 100_000_000_000
export const NEW_TOKEN_DEFAULT_TOTAL_SUPPLY_VALUE = 1_000_000_000
/** Quick-select presets for the total-supply input, in whole tokens. */
export const NEW_TOKEN_TOTAL_SUPPLY_PRESETS = [10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000] as const

/**
 * Max ticker length enforced in the UI. The token factory stores `symbol` as an unbounded `string`
 * (no on-chain cap), so this is a product limit; 32 mirrors the legacy bytes32 symbol representation.
 */
export const NEW_TOKEN_SYMBOL_MAX_LENGTH = 32
const NEW_TOKEN_PLACEHOLDER = new Token(
  UniverseChainId.Unichain,
  NEW_TOKEN_PLACEHOLDER_ADDRESS,
  NEW_TOKEN_DECIMALS,
  '',
  '',
)
const NEW_TOKEN_DEFAULT_TOTAL_SUPPLY = CurrencyAmount.fromRawAmount(
  NEW_TOKEN_PLACEHOLDER,
  `${NEW_TOKEN_DEFAULT_TOTAL_SUPPLY_VALUE}${'0'.repeat(NEW_TOKEN_DECIMALS)}`,
)

export enum CreateAuctionStep {
  ADD_TOKEN_INFO = 0,
  CONFIGURE_AUCTION = 1,
  CUSTOMIZE_POOL = 2,
  REVIEW_LAUNCH = 3,
}

export enum TokenMode {
  CREATE_NEW = 'create_new',
  EXISTING = 'existing',
}

type CreateNewTokenFields = {
  name: string
  symbol: string
  description: string
  imageUrl: string
  /**
   * `blob:` URL for instant preview after file pick. Cleared after the Pinata-resolved image loads
   * in the background so later steps keep showing the upload until the gateway URL is ready.
   */
  localImagePreviewUri: string
  network: UniverseChainId
  xProfile: string
  totalSupply: CurrencyAmount<Currency>
}

type ExistingTokenFields = {
  existingTokenCurrencyInfo: CurrencyInfo | undefined
  description: string
  xProfile: string
  websiteLink: string
  totalSupply: CurrencyAmount<Currency> | undefined
}

export type CreateNewTokenFormState = { mode: TokenMode.CREATE_NEW } & CreateNewTokenFields
export type ExistingTokenFormState = { mode: TokenMode.EXISTING } & ExistingTokenFields
export type TokenFormState = CreateNewTokenFormState | ExistingTokenFormState

/** Default share for new tokens: auction the entire minted supply. */
export const DEFAULT_NEW_TOKEN_AUCTION_SUPPLY_PERCENT = new Percent(100, 100)

/** Default share for existing tokens: auction the user's entire wallet balance. */
export const DEFAULT_EXISTING_TOKEN_AUCTION_SUPPLY_PERCENT = new Percent(100, 100)

/**
 * Which raise-currency option the creator picked: the chain's native currency (ETH/AVAX/OKB) or its
 * curated primary stablecoin (USDC/USDG/USDT0). Resolve to the actual token via
 * `getRaiseCurrencyAsCurrency` / `getPrimaryStablecoin`.
 */
export enum RaiseCurrency {
  // oxlint-disable-next-line eslint-js/no-restricted-syntax -- raise-currency slot name, not the NATIVE_CHAIN_ID sentinel
  NATIVE = 'NATIVE',
  STABLECOIN = 'STABLECOIN',
}

/** What currency the user types floor price / FDV in (raise token vs USD fiat). */
export type InputCurrency = 'raise' | 'usd'

/** What the floor-price numeric input represents. */
export type FloorPriceDenomination = 'floorPrice' | 'fdv'

export type FloorPriceInputState = {
  /** Canonical floor price this display draft produced; used to avoid hydrating stale input text. */
  floorPrice: string
  /** Dot-decimal, unlocalized value exactly as the user entered it. */
  rawValue: string
  denomination: FloorPriceDenomination
  inputCurrency: InputCurrency
}

export enum PostAuctionLiquidityAllocationType {
  SINGLE = 'single',
  TIERED = 'tiered',
}

// Floor per LP bracket (single schedule or every tier), sourced from the launcher SDK.
export const MIN_POST_AUCTION_LIQUIDITY_PERCENT = MIN_LP_ALLOCATION_PERCENT
export const MAX_POST_AUCTION_LIQUIDITY_PERCENT = 100
export const MAX_POST_AUCTION_LIQUIDITY_TIERS = 32

// Max token description length (chars). Matches the backend cap (liquidity CreateAuction +
// data-api ingest) so a description entered here is never rejected or silently truncated.
export const MAX_TOKEN_DESCRIPTION_LENGTH = 2000
export const DEFAULT_POST_AUCTION_LIQUIDITY_TIER_INITIAL_MILESTONE = 100_000
export const UNBOUNDED_TIER_ID = 'tier-unbounded'
export const DEFAULT_POST_AUCTION_LIQUIDITY_PERCENT = 100

export type PostAuctionLiquidityTier = {
  id: string
  raiseMilestone: string
  percent: number
}

export type SinglePostAuctionLiquidityAllocation = {
  type: PostAuctionLiquidityAllocationType.SINGLE
  percent: number
}

export type TieredPostAuctionLiquidityAllocation = {
  type: PostAuctionLiquidityAllocationType.TIERED
  tiers: PostAuctionLiquidityTier[]
}

export type PostAuctionLiquidityAllocation = SinglePostAuctionLiquidityAllocation | TieredPostAuctionLiquidityAllocation

/**
 * Token amounts committed after confirming the token info step.
 * Holds the total supply alongside the auction allocation amounts.
 */
export type AuctionTokenAmounts = {
  totalSupply: CurrencyAmount<Currency>
  /** Tokens deposited into the auction (sold S + LP reserve R = r·S). */
  auctionSupplyAmount: CurrencyAmount<Currency>
  /** Each LP token leg: r·S = R = deposit × r/(1+r). */
  postAuctionLiquidityAmount: CurrencyAmount<Currency>
}

export type ConfigureAuctionFormState = {
  startTime: Date | undefined
  endTime: Date | undefined
  committed: AuctionTokenAmounts | undefined
  postAuctionLiquidityAllocation: PostAuctionLiquidityAllocation
  raiseCurrency: RaiseCurrency
  floorPrice: string
  floorPriceInput: FloorPriceInputState | undefined
  kycValidationHookAddress: string | undefined
}

export type XVerification = {
  xHandle: string
  xVerificationToken: string
  /** Wallet the token was bound to at verify time. Cleared on wallet switch so a stale token never submits. */
  boundWalletAddress: string
}

export enum PriceRangeStrategy {
  CONCENTRATED_FULL_RANGE = 'concentrated_full_range',
  FULL_RANGE = 'full_range',
  CUSTOM_RANGE = 'custom_range',
}

/** Sentinel for an unbounded max price range (+∞). */
export const CUSTOM_PRICE_RANGE_POSITIVE_INFINITY = 'positive_infinity' as const

/**
 * Lowest finite percent-from-clearing the histogram renders. Doubles as the leftmost
 * value the min bound can take, since `−∞` is no longer a selectable option.
 */
export const MIN_CUSTOM_PRICE_RANGE_PERCENT_FROM_CLEARING = -100

export type CustomPriceRangeValue = number | typeof CUSTOM_PRICE_RANGE_POSITIVE_INFINITY

export type CustomPriceRangeEntry = {
  id: string
  liquidityPercent: number
  minPercentFromClearing: CustomPriceRangeValue
  maxPercentFromClearing: CustomPriceRangeValue
}

export type CustomPriceRangePreset = Pick<CustomPriceRangeEntry, 'minPercentFromClearing' | 'maxPercentFromClearing'>

export const MAX_CUSTOM_PRICE_RANGE_ENTRIES = 10

export const CUSTOM_PRICE_RANGE_PRESETS: readonly CustomPriceRangePreset[] = [
  { minPercentFromClearing: -50, maxPercentFromClearing: 100 },
  { minPercentFromClearing: -66, maxPercentFromClearing: 200 },
  { minPercentFromClearing: -33, maxPercentFromClearing: 50 },
  { minPercentFromClearing: -20, maxPercentFromClearing: 25 },
] as const

/** Preset duration for pool timelock (custom uses a calendar end date). */
export enum TimeLockPreset {
  ThirtyDays = 'thirty_days',
  SixMonths = 'six_months',
  OneYear = 'one_year',
  Permanent = 'permanent',
  Custom = 'custom',
}

export const TIMELOCK_PRESET_DURATION_DAYS: Record<Exclude<TimeLockPreset, TimeLockPreset.Custom>, number> = {
  [TimeLockPreset.ThirtyDays]: 30,
  [TimeLockPreset.SixMonths]: 183,
  [TimeLockPreset.OneYear]: 365,
  /** Effectively non-expiring for product purposes; encoded as a long fixed duration. */
  [TimeLockPreset.Permanent]: 365 * 100000,
}

export type CustomizePoolState = {
  fee: FeeData
  priceRangeStrategy: PriceRangeStrategy
  customPriceRanges: CustomPriceRangeEntry[]
  poolOwner: string
  timeLockEnabled: boolean
  timeLockPreset: TimeLockPreset
  timeLockDurationDays: number
  sendFeesEnabled: boolean
  feesRecipientAddress: string
  buybackAndBurnEnabled: boolean
}

const DEFAULT_FEE_DATA: FeeData = {
  feeAmount: FeeAmount.MEDIUM,
  tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
  isDynamic: false,
}

/** QuickLaunch: quick-launch auction duration presets (30 min / 1 h / 4 h). */
export enum QuickLaunchDuration {
  ThirtyMinutes = 'thirty_minutes',
  OneHour = 'one_hour',
  FourHours = 'four_hours',
}

export const DEFAULT_QUICK_LAUNCH_DURATION = QuickLaunchDuration.ThirtyMinutes

interface CreateAuctionState {
  step: CreateAuctionStep
  /** QuickLaunch: locks everything except token info to the quick-launch preset (flag-gated UI). */
  quickLaunch: boolean
  /** QuickLaunch: the one decision quick launch exposes — how long the auction runs. */
  quickLaunchDuration: QuickLaunchDuration
  tokenForm: TokenFormState
  tokenColor: TokenAccentHex | undefined
  configureAuction: ConfigureAuctionFormState
  customizePool: CustomizePoolState
  xVerification: XVerification | undefined
}

export const DEFAULT_EXISTING_TOKEN_FORM: ExistingTokenFormState = {
  mode: TokenMode.EXISTING,
  existingTokenCurrencyInfo: undefined,
  description: '',
  xProfile: '',
  websiteLink: '',
  totalSupply: undefined,
}

export const DEFAULT_CREATE_AUCTION_STATE: CreateAuctionState = {
  step: CreateAuctionStep.ADD_TOKEN_INFO,
  quickLaunch: true,
  quickLaunchDuration: DEFAULT_QUICK_LAUNCH_DURATION,
  tokenColor: undefined,
  xVerification: undefined,
  customizePool: {
    fee: DEFAULT_FEE_DATA,
    priceRangeStrategy: PriceRangeStrategy.CONCENTRATED_FULL_RANGE,
    customPriceRanges: [
      {
        id: 'custom-range-1',
        liquidityPercent: 100,
        minPercentFromClearing: MIN_CUSTOM_PRICE_RANGE_PERCENT_FROM_CLEARING,
        maxPercentFromClearing: CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
      },
    ],
    poolOwner: '',
    timeLockEnabled: false,
    timeLockPreset: TimeLockPreset.OneYear,
    timeLockDurationDays: 365,
    sendFeesEnabled: false,
    feesRecipientAddress: '',
    buybackAndBurnEnabled: false,
  },
  tokenForm: {
    mode: TokenMode.CREATE_NEW,
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    localImagePreviewUri: '',
    // Mainnet is pinned first in the supported-chains list; the create-new-token picker defaults to it.
    network: UniverseChainId.Mainnet,
    xProfile: '',
    totalSupply: NEW_TOKEN_DEFAULT_TOTAL_SUPPLY,
  },
  configureAuction: {
    startTime: undefined,
    endTime: undefined,
    committed: undefined,
    postAuctionLiquidityAllocation: {
      type: PostAuctionLiquidityAllocationType.SINGLE,
      percent: DEFAULT_POST_AUCTION_LIQUIDITY_PERCENT,
    },
    raiseCurrency: RaiseCurrency.NATIVE,
    floorPrice: '',
    floorPriceInput: undefined,
    kycValidationHookAddress: undefined,
  },
}

interface CreateAuctionStoreActions {
  setStep: (step: CreateAuctionStep) => void
  setQuickLaunch: (enabled: boolean) => void
  setQuickLaunchDuration: (duration: QuickLaunchDuration) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  setTokenMode: (mode: TokenMode) => void
  updateCreateNewTokenField: <K extends keyof CreateNewTokenFields>(key: K, value: CreateNewTokenFields[K]) => void
  updateExistingTokenField: <K extends keyof ExistingTokenFields>(key: K, value: ExistingTokenFields[K]) => void
  setTokenForm: (form: TokenFormState) => void
  commitTokenFormAndAdvance: () => void
  setXVerification: (value: XVerification | undefined) => void
  setPostAuctionLiquidityAllocationType: (type: PostAuctionLiquidityAllocationType) => void
  setSinglePostAuctionLiquidityPercent: (percent: number) => void
  addPostAuctionLiquidityTier: (options?: { usdPriceNum: number | null }) => void
  updatePostAuctionLiquidityTier: (
    tierId: string,
    config: Partial<Pick<PostAuctionLiquidityTier, 'raiseMilestone' | 'percent'>>,
  ) => void
  removePostAuctionLiquidityTier: (tierId: string) => void
  setAuctionConfig: (config: { auctionSupplyAmount: CurrencyAmount<Currency> }) => void
  /** New-token only: set a custom total supply and rebase the committed auction amounts (LP-960). */
  setNewTokenTotalSupply: (totalSupply: CurrencyAmount<Currency>) => void
  setStartTime: (startTime: Date | undefined) => void
  setEndTime: (endTime: Date | undefined) => void
  setRaiseCurrency: (currency: RaiseCurrency) => void
  setFloorPrice: (price: string, input?: Omit<FloorPriceInputState, 'floorPrice'>) => void
  setKycValidationHookAddress: (address: string | undefined) => void
  setFee: (fee: FeeData) => void
  setPriceRangeStrategy: (strategy: PriceRangeStrategy) => void
  addCustomPriceRangePreset: (preset: CustomPriceRangePreset) => void
  updateCustomPriceRangeLiquidityPercent: (entryId: string, percent: number) => void
  updateCustomPriceRangeBounds: (
    entryId: string,
    bounds: Partial<Pick<CustomPriceRangeEntry, 'minPercentFromClearing' | 'maxPercentFromClearing'>>,
  ) => void
  removeCustomPriceRange: (entryId: string) => void
  setPoolOwner: (owner: string) => void
  setTimeLockEnabled: (enabled: boolean) => void
  setTimeLockPreset: (preset: TimeLockPreset) => void
  setTimeLockDurationDays: (days: number) => void
  setSendFeesEnabled: (enabled: boolean) => void
  setFeesRecipientAddress: (address: string) => void
  setBuybackAndBurnEnabled: (enabled: boolean) => void
  setTokenColor: (color: TokenAccentHex | undefined) => void
  reset: () => void
}

export interface CreateAuctionStoreState extends CreateAuctionState {
  actions: CreateAuctionStoreActions
}
