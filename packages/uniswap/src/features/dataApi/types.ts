import { NetworkStatus } from '@apollo/client'
import { Contract } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi, SpamCode } from '@universe/api'
import { BridgedWithdrawalInfo } from '@universe/api/src/clients/graphql/__generated__/types-and-hooks'
import { FoTPercent } from 'uniswap/src/features/tokens/TokenWarningModal'
import { CurrencyId } from 'uniswap/src/types/currency'

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
  bridgedWithdrawalInfo?: Maybe<BridgedWithdrawalInfo>
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
