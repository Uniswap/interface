import { type Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { FeeData } from '~/types/liquidity'

/**
 * Placeholder address for a token that is being created and does not have an address yet.
 * Must not be ZERO_ADDRESS (native token). Do not use for API lookups or pool fetches.
 */
export const NEW_TOKEN_PLACEHOLDER_ADDRESS = '0x0000000000000000000000000000000000000001'
export const NEW_TOKEN_DECIMALS = 18
const NEW_TOKEN_TOTAL_SUPPLY = 1_000_000_000
const NEW_TOKEN_PLACEHOLDER = new Token(
  UniverseChainId.Unichain,
  NEW_TOKEN_PLACEHOLDER_ADDRESS,
  NEW_TOKEN_DECIMALS,
  '',
  '',
)
const NEW_TOKEN_DEFAULT_TOTAL_SUPPLY = CurrencyAmount.fromRawAmount(
  NEW_TOKEN_PLACEHOLDER,
  `${NEW_TOKEN_TOTAL_SUPPLY}${'0'.repeat(NEW_TOKEN_DECIMALS)}`,
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
  network: UniverseChainId
  xProfile: string
  totalSupply: CurrencyAmount<Currency>
}

type ExistingTokenFields = {
  existingTokenCurrencyInfo: CurrencyInfo | undefined
  description: string
  xProfile: string
  totalSupply: CurrencyAmount<Currency> | undefined
}

export type CreateNewTokenFormState = {
  mode: TokenMode.CREATE_NEW
} & CreateNewTokenFields
export type ExistingTokenFormState = {
  mode: TokenMode.EXISTING
} & ExistingTokenFields
export type TokenFormState = CreateNewTokenFormState | ExistingTokenFormState

export enum AuctionType {
  BOOTSTRAP_LIQUIDITY = 'bootstrap_liquidity',
  FUNDRAISE = 'fundraise',
}

export enum RaiseCurrency {
  ETH = 'ETH',
  USDC = 'USDC',
}

export enum PostAuctionLiquidityAllocationType {
  SINGLE = 'single',
  TIERED = 'tiered',
}

export const MIN_POST_AUCTION_LIQUIDITY_PERCENT = 25
export const MAX_POST_AUCTION_LIQUIDITY_PERCENT = 100
export const MAX_POST_AUCTION_LIQUIDITY_TIERS = 10
export const DEFAULT_POST_AUCTION_LIQUIDITY_TIER_INITIAL_MILESTONE = 100_000
export const UNBOUNDED_TIER_ID = 'tier-unbounded'
export const DEFAULT_POST_AUCTION_LIQUIDITY_PERCENT_BY_AUCTION_TYPE = {
  [AuctionType.BOOTSTRAP_LIQUIDITY]: 100,
  [AuctionType.FUNDRAISE]: 50,
} as const

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
  maxDurationDays: number
  activeAuctionType: AuctionType
  committed: AuctionTokenAmounts | undefined
  postAuctionLiquidityAllocation: PostAuctionLiquidityAllocation
  raiseCurrency: RaiseCurrency
  floorPrice: string
  kycValidationHookAddress: string | undefined
}

type XVerification = {
  xHandle: string
  xVerificationToken: string
}

export enum PriceRangeStrategy {
  CONCENTRATED_FULL_RANGE = 'concentrated_full_range',
  FULL_RANGE = 'full_range',
}

type CustomizePoolState = {
  fee: FeeData
  priceRangeStrategy: PriceRangeStrategy
  poolOwner: string
  timeLockEnabled: boolean
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

interface CreateAuctionState {
  step: CreateAuctionStep
  tokenForm: TokenFormState
  tokenColor: string | undefined
  configureAuction: ConfigureAuctionFormState
  customizePool: CustomizePoolState
  xVerification: XVerification | undefined
}

export const DEFAULT_EXISTING_TOKEN_FORM: ExistingTokenFormState = {
  mode: TokenMode.EXISTING,
  existingTokenCurrencyInfo: undefined,
  description: '',
  xProfile: '',
  totalSupply: undefined,
}

export const DEFAULT_CREATE_AUCTION_STATE: CreateAuctionState = {
  step: CreateAuctionStep.ADD_TOKEN_INFO,
  tokenColor: undefined,
  xVerification: undefined,
  customizePool: {
    fee: DEFAULT_FEE_DATA,
    priceRangeStrategy: PriceRangeStrategy.CONCENTRATED_FULL_RANGE,
    poolOwner: '',
    timeLockEnabled: false,
    timeLockDurationDays: 5,
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
    network: UniverseChainId.Unichain,
    xProfile: '',
    totalSupply: NEW_TOKEN_DEFAULT_TOTAL_SUPPLY,
  },
  configureAuction: {
    startTime: undefined,
    maxDurationDays: 5,
    activeAuctionType: AuctionType.BOOTSTRAP_LIQUIDITY,
    committed: undefined,
    postAuctionLiquidityAllocation: {
      type: PostAuctionLiquidityAllocationType.SINGLE,
      percent: DEFAULT_POST_AUCTION_LIQUIDITY_PERCENT_BY_AUCTION_TYPE[AuctionType.BOOTSTRAP_LIQUIDITY],
    },
    raiseCurrency: RaiseCurrency.ETH,
    floorPrice: '',
    kycValidationHookAddress: undefined,
  },
}

interface CreateAuctionStoreActions {
  setStep: (step: CreateAuctionStep) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  setTokenMode: (mode: TokenMode) => void
  updateCreateNewTokenField: <K extends keyof CreateNewTokenFields>(key: K, value: CreateNewTokenFields[K]) => void
  updateExistingTokenField: <K extends keyof ExistingTokenFields>(key: K, value: ExistingTokenFields[K]) => void
  setTokenForm: (form: TokenFormState) => void
  commitTokenFormAndAdvance: () => void
  setXVerification: (value: XVerification | undefined) => void
  setAuctionType: (type: AuctionType) => void
  setPostAuctionLiquidityAllocationType: (type: PostAuctionLiquidityAllocationType) => void
  setSinglePostAuctionLiquidityPercent: (percent: number) => void
  addPostAuctionLiquidityTier: () => void
  updatePostAuctionLiquidityTier: (
    tierId: string,
    config: Partial<Pick<PostAuctionLiquidityTier, 'raiseMilestone' | 'percent'>>,
  ) => void
  removePostAuctionLiquidityTier: (tierId: string) => void
  setAuctionConfig: (config: { auctionSupplyAmount: CurrencyAmount<Currency> }) => void
  setStartTime: (startTime: Date | undefined) => void
  setMaxDurationDays: (days: number) => void
  setRaiseCurrency: (currency: RaiseCurrency) => void
  setFloorPrice: (price: string) => void
  setKycValidationHookAddress: (address: string | undefined) => void
  setFee: (fee: FeeData) => void
  setPriceRangeStrategy: (strategy: PriceRangeStrategy) => void
  setPoolOwner: (owner: string) => void
  setTimeLockEnabled: (enabled: boolean) => void
  setTimeLockDurationDays: (days: number) => void
  setSendFeesEnabled: (enabled: boolean) => void
  setFeesRecipientAddress: (address: string) => void
  setBuybackAndBurnEnabled: (enabled: boolean) => void
  setTokenColor: (color: string | undefined) => void
  reset: () => void
}

export interface CreateAuctionStoreState extends CreateAuctionState {
  actions: CreateAuctionStoreActions
}
