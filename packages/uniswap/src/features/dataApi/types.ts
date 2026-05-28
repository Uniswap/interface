import type { NetworkStatus } from '@apollo/client'
import type { Contract } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { GraphQLApi, SpamCode } from '@universe/api'
import type { FoTPercent } from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import type { CurrencyId } from 'uniswap/src/types/currency'

/** When present, rows derived from the same search multichain hit share this parent (for recents / TDP). */
export type SearchMultichainParent = {
  id: string
  tokenCurrencyIds: CurrencyId[]
}

export type RestContract = Pick<Contract, 'chainId' | 'address'>

export interface BaseResult<T> {
  data?: T
  loading: boolean
  networkStatus: NetworkStatus
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

export enum TokenList {
  Default = 'default',
  NonDefault = 'non_default',
  Blocked = 'blocked',
}

export enum AttackType {
  Honeypot = 'honeypot',
  Airdrop = 'airdrop',
  Impersonator = 'impersonator',
  HighFees = 'high-fees',
  Other = 'other',
}

export type SafetyInfo = {
  tokenList: TokenList
  attackType?: AttackType
  protectionResult: GraphQLApi.ProtectionResult
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
  bridgedWithdrawalInfo?: Maybe<GraphQLApi.BridgedWithdrawalInfo>
  /** Used for deduplication of tokens across chains. */
  projectId?: Maybe<string>
  /** Set when this `CurrencyInfo` was built from a search `MultichainToken` flatten (one row per chain). */
  searchMultichainParent?: SearchMultichainParent
}

// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  id: string
  cacheId: string
  quantity: number // float representation of balance
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
 * Multichain search result: one logical token found across multiple chains.
 */
export type MultichainSearchResult = {
  id: string
  name: string
  symbol: string
  logoUrl: Maybe<string>
  safetyInfo?: Maybe<SafetyInfo>
  tokens: CurrencyInfo[]
}
