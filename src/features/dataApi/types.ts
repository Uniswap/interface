import { Currency } from '@uniswap/sdk-core'
import { CurrencyId } from 'src/utils/currencyId'

export type CurrencyInfo = {
  currency: Currency
  currencyId: CurrencyId
  logoUrl: NullUndefined<string>
}

// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  quantity: number // float representation of balance
  balanceUSD: number
  currencyInfo: CurrencyInfo
  relativeChange24: number
}
