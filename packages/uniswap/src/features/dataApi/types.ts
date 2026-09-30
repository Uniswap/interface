import type { Contract } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { SpamCode } from '@universe/api'
import type { ProtectionResult } from 'uniswap/src/features/dataApi/safety'
import type { PoolSearchHistoryResult } from 'uniswap/src/features/search/SearchHistoryResult'
import type { FoTPercent } from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import type { CurrencyId } from 'uniswap/src/types/currency'

/** How to withdraw a bridged asset to its native chain (`chain` is a display name, not an id). */
export type BridgedWithdrawalInfo = {
  chain: string
  provider: string
  url: string
}

/** When present, rows derived from the same search multichain hit share this parent (for recents / TDP). */
export type SearchMultichainParent = {
  id: string
  tokenCurrencyIds: CurrencyId[]
  /**
   * Set when the hit came from the v2 search suppressed bucket (lower-quality match).
   * Mirrors `MultichainSearchResult.isSuppressed` so the flag survives chain-filtered flattens.
   */
  isSuppressed?: boolean
}

export type RestContract = Pick<Contract, 'chainId' | 'address'>

export interface BaseResult<T> {
  data?: T
  loading: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
  error?: Error
  /** Epoch ms when the underlying query last successfully fetched data. */
  dataUpdatedAt?: number
}

/** Outage state from data-fetching hooks — pairs an error with the last-known data timestamp. */
export type DataApiOutageState = {
  error?: Error
  dataUpdatedAt?: number
}

/** Outage props for UI components — boolean flag with the last-known data timestamp. */
export type DataApiOutageProps = {
  isOutage?: boolean
  dataUpdatedAt?: number
}

export interface PaginationControls {
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

/**
 * App-level chart / windowed-stat time range. Map to the data-api or liquidity-service protobuf
 * enums only where the request is built (`toRestHistoryDuration`, `toLiquidityHistoryDuration`).
 */
export enum HistoryDuration {
  Hour = 'HOUR',
  Day = 'DAY',
  Week = 'WEEK',
  Month = 'MONTH',
  Year = 'YEAR',
  Max = 'MAX',
}

export enum TokenList {
  Default = 'default',
  NonDefault = 'non_default',
  Blocked = 'blocked',
}

export enum AttackType {
  Honeypot = 'honeypot',
  ExitScamRisk = 'exit-scam-risk',
  Airdrop = 'airdrop',
  Impersonator = 'impersonator',
  HighFees = 'high-fees',
  Other = 'other',
}

export type SafetyInfo = {
  tokenList: TokenList
  attackType?: AttackType
  protectionResult: ProtectionResult
  blockaidFees?: FoTPercent
}

export type CurrencyInfo = {
  currency: Currency
  currencyId: CurrencyId
  safetyInfo?: Maybe<SafetyInfo>
  spamCode?: Maybe<SpamCode>
  logoUrl: Maybe<string>
  isSpam?: Maybe<boolean>
  // Indicates if this currency is from another chain than user searched
  isFromOtherNetwork?: boolean
  // Indicates if this token is a bridged asset
  isBridged?: Maybe<boolean>
  // Information about how to withdraw a bridged asset to its native chain
  bridgedWithdrawalInfo?: Maybe<BridgedWithdrawalInfo>
  /** Used for deduplication of tokens across chains. */
  projectId?: Maybe<string>
  /** Set when this `CurrencyInfo` was built from a search `MultichainToken` flatten (one row per chain). */
  searchMultichainParent?: SearchMultichainParent
  /**
   * Display stats from the v2 search response (Search V2 PRD), with this chain's 1d volume when
   * the response carries per-chain stats. Mirrors `MultichainSearchResult.stats` so the data
   * survives chain-filtered flattens. Absent on the v1 path.
   */
  searchStats?: SearchTokenStats
  /** Backend category ids in BE ranking order, from v2 data-api token payloads; absent on v1/GraphQL-built
   *  CurrencyInfo. Hydrate via ListCategories. */
  categoryIds?: string[]
}

// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  id: string
  cacheId: string
  quantity: number // float representation of balance
  /**
   * Exact raw (base-unit) balance string when the API provides one. `quantity` is a float64 and
   * loses precision past ~15-17 significant digits, so use this for exact-amount math.
   */
  quantityRaw?: string
  balanceUSD: Maybe<number>
  currencyInfo: CurrencyInfo
  relativeChange24: Maybe<number>
  isHidden: Maybe<boolean>
}

/**
 * One chain-specific balance in a multichain token's `tokens` array.
 * currencyInfo is prebuilt so consumers (UI, selectors) can use it directly
 * without calling buildCurrency/buildCurrencyInfo.
 */
export type PortfolioChainBalance = {
  chainId: number
  address: string
  decimals: number
  quantity: number
  valueUsd: Maybe<number>
  /** Hidden flag for this chain-specific balance (API / user visibility). */
  isHidden: Maybe<boolean>
  currencyInfo: CurrencyInfo
}

/**
 * Multichain balance: one logical token that can exist on multiple chains.
 * Same shape for legacy (tokens.length === 1) and true multichain (tokens.length >= 1).
 */
export type PortfolioMultichainBalance = {
  id: string
  cacheId: string
  name: string
  symbol: string
  logoUrl: Maybe<string>
  totalAmount: number
  priceUsd: Maybe<number>
  pricePercentChange1d: Maybe<number>
  totalValueUsd: Maybe<number>
  isHidden: Maybe<boolean>
  tokens: PortfolioChainBalance[]
}

/**
 * Display stats for a search result token row (Search V2 PRD: price, price change, FDV). 1D volume
 * isn't displayed on token rows but still picks the primary chain and feeds RWA collection rows.
 * Populated from the v2 search response; absent on the v1 path.
 */
export type SearchTokenStats = {
  priceUsd?: number
  pricePercentChange1d?: number
  fdvUsd?: number
  volume1dUsd?: number
}

/**
 * Multichain search result: one logical token found across multiple chains.
 */
export type MultichainSearchResult = {
  id: string
  name: string
  symbol: string
  logoUrl: Maybe<string>
  safetyInfo?: Maybe<SafetyInfo>
  tokens: CurrencyInfo[]
  /**
   * Lower-quality match from the v2 search suppressed bucket (Search V2 PRD). Currently rendered
   * inline after default results; the "see more" expando UI keys off this flag.
   */
  isSuppressed?: boolean
  /** Parent-level display stats (aggregate 1d volume across chains). */
  stats?: SearchTokenStats
}

/** Display stats for a search result pool row (Search V2 PRD: 1D volume and APR). */
export type PoolSearchStats = {
  volume1dUsd?: number
  apr?: number
}

/**
 * Live pool search row: the persisted identity shape plus volatile display stats. Stats are
 * intentionally not part of `PoolSearchHistoryResult` — history persistence copies explicit
 * fields, so stats never reach redux and can't go stale there.
 */
export type PoolSearchResult = PoolSearchHistoryResult & {
  stats?: PoolSearchStats
}
