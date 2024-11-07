import { Currency } from '@uniswap/sdk-core'
import { ProtectionResult, SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { SpamCode } from 'uniswap/src/data/types'
import { CurrencyId } from 'uniswap/src/types/currency'

export enum TokenList {
  Default = 'default',
  NonDefault = 'non_default',
  Blocked = 'blocked',
}

export enum AttackType {
  Airdrop = 'airdrop',
  Impersonator = 'impersonator',
  HighFees = 'high-fees',
  Other = 'other',
}

export type SafetyInfo = {
  tokenList: TokenList
  attackType?: AttackType
  protectionResult: ProtectionResult
}

export type CurrencyInfo = {
  currency: Currency
  currencyId: CurrencyId
  safetyLevel: Maybe<SafetyLevel>
  safetyInfo?: Maybe<SafetyInfo>
  spamCode?: Maybe<SpamCode>
  logoUrl: Maybe<string>
  isSpam?: Maybe<boolean>
}

// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  cacheId: string
  quantity: number // float representation of balance
  balanceUSD: Maybe<number>
  currencyInfo: CurrencyInfo
  relativeChange24: Maybe<number>
  isHidden: Maybe<boolean>
}
