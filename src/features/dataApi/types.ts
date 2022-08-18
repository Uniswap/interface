import { Currency } from '@uniswap/sdk-core'
import { ChainIdToCurrencyIdTo } from 'src/constants/chains'
import { CurrencyId } from 'src/utils/currencyId'

/** Portfolio Types */
export type ChainIdToCurrencyIdToPortfolioBalance = ChainIdToCurrencyIdTo<PortfolioBalance>
export type PortfolioBalances = Record<CurrencyId, PortfolioBalance>

// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  quantity: number // float representation of balance
  balanceUSD: number
  currency: Currency
  relativeChange24: number
}

/** Spot Prices Types */
export type SpotPrice = {
  price: number
  relativeChange24: number
}
export type SpotPrices = Record<CurrencyId, SpotPrice>

/** Historical Prices Types */
export type DailyPrice = {
  timestamp: number
  close: number
}
export type DailyPrices = DailyPrice[]
