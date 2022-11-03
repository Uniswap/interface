import { QueryResult } from '@apollo/client'
import { Currency } from '@uniswap/sdk-core'
import { CurrencyId } from 'src/utils/currencyId'

export type CurrencyInfo = {
  currency: Currency
  currencyId: CurrencyId
  safetyLevel: NullUndefined<SafetyLevel>
  logoUrl: NullUndefined<string>
}

// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  quantity: number // float representation of balance
  balanceUSD: number
  currencyInfo: CurrencyInfo
  relativeChange24: number
}

export type GqlResult<T> = Pick<QueryResult<T>, 'data' | 'loading' | 'error'>

export enum SafetyLevel {
  Blocked = 'BLOCKED',
  Medium = 'MEDIUM_WARNING',
  Strong = 'STRONG_WARNING',
  Verified = 'VERIFIED',
}
