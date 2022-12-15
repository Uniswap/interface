import { QueryResult } from '@apollo/client'
import { Currency } from '@uniswap/sdk-core'
import { SafetyLevel } from 'src/data/__generated__/types-and-hooks'
import { CurrencyId } from 'src/utils/currencyId'

export type CurrencyInfo = {
  currency: Currency
  currencyId: CurrencyId
  safetyLevel: NullUndefined<SafetyLevel>
  logoUrl: NullUndefined<string>
  isSpam?: NullUndefined<boolean>
}

// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  quantity: number // float representation of balance
  balanceUSD: NullUndefined<number>
  currencyInfo: CurrencyInfo
  relativeChange24: NullUndefined<number>
}

// Query result does not have a refetch property so add it here in case it needs to get returned
export type GqlResult<T> = Pick<QueryResult<T>, 'data' | 'loading' | 'error'> &
  Partial<Pick<QueryResult<T>, 'networkStatus'>> & {
    refetch?: () => void // TODO: [MOB-3887] figure out the proper type for this from a QueryResult
  }
