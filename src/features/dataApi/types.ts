import { Currency } from '@uniswap/sdk-core'

// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  quantity: number // float representation of balance
  balanceUSD: number
  currency: Currency
  relativeChange24: number
}
