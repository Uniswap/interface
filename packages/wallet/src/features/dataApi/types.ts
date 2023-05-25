import { QueryResult } from '@apollo/client'
import { Currency } from '@uniswap/sdk-core'
import { SafetyLevel } from 'wallet/src/data/__generated__/types-and-hooks'
import { CurrencyId } from 'wallet/src/utils/currencyId'

export type CurrencyInfo = {
  currency: Currency
  currencyId: CurrencyId
  safetyLevel: Maybe<SafetyLevel>
  logoUrl: Maybe<string>
  isSpam?: Maybe<boolean>
}

// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  quantity: number // float representation of balance
  balanceUSD: Maybe<number>
  currencyInfo: CurrencyInfo
  relativeChange24: Maybe<number>
}

// Query result does not have a refetch property so add it here in case it needs to get returned
export type GqlResult<T> = Pick<QueryResult<T>, 'data' | 'loading' | 'error'> &
  Partial<Pick<QueryResult<T>, 'networkStatus'>> & {
    refetch?: () => void // TODO: [MOB-222] figure out the proper type for this from a QueryResult
  }
