import { Currency } from '@uniswap/sdk-core'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
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
  cacheId: string
  quantity: number // float representation of balance
  balanceUSD: Maybe<number>
  currencyInfo: CurrencyInfo
  relativeChange24: Maybe<number>
  isHidden: Maybe<boolean>
}
