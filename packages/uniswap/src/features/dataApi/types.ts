import { type NetworkStatus } from '@apollo/client'
import { type Contract } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { type Currency } from '@uniswap/sdk-core'
import { type GraphQLApi, type SpamCode } from '@universe/api'
import { type FoTPercent } from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { type CurrencyId } from 'uniswap/src/types/currency'

export type RestContract = Pick<Contract, 'chainId' | 'address'>

export interface BaseResult<T> {
  data?: T
  loading: boolean
  networkStatus: NetworkStatus
  refetch: () => void
  error?: Error
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
