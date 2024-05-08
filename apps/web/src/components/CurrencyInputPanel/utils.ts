import { Currency } from '@uniswap/sdk-core'

export function formatCurrencySymbol(currency?: Currency): string | undefined {
  return currency && currency.symbol && currency.symbol.length > 20
    ? currency.symbol.slice(0, 4) + '...' + currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
    : currency?.symbol
}
