import { Currency, CurrencyAmount } from '@uniswap/sdk-core'

export type CurrencyWithMetadata = {
  currency: Currency
  currencyAmount: CurrencyAmount<Currency> | null
  balanceUSD: number | null
}
