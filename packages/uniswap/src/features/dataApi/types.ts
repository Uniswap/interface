import { Contract } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { SpamCode } from 'uniswap/src/data/types'
import { FoTPercent } from 'uniswap/src/features/tokens/TokenWarningModal'
import { CurrencyId } from 'uniswap/src/types/currency'

export type RestContract = Pick<Contract, 'chainId' | 'address'>

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
