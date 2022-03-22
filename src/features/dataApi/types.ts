import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ChainIdToCurrencyIdTo } from 'src/constants/chains'
import { CovalentWalletBalanceItem } from 'src/features/dataApi/covalentTypes'
import { CurrencyId } from 'src/utils/currencyId'

/** Portfolio Types */
export type ChainIdToCurrencyIdToPortfolioBalance = ChainIdToCurrencyIdTo<PortfolioBalance>
export type PortfolioBalances = Record<CurrencyId, PortfolioBalance>
// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  amount: CurrencyAmount<Currency>
  balanceUSD: number
  relativeChange24: number
}
// Portfolio balance as stored in Redux
export type SerializablePortfolioBalance = {
  balance: number
  balanceUSD: number
} & Pick<
  CovalentWalletBalanceItem,
  'contract_address' | 'contract_ticker_symbol' | 'quote_rate' | 'quote_rate_24h'
>

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
