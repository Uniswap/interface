import { Currency } from '@taraswap/sdk-core'
import { CrossChainCurrency } from 'types/tokens'

export function formatCurrencySymbol(currency?: Currency): string | undefined {
  return currency && currency.symbol && currency.symbol.length > 20
    ? currency.symbol.slice(0, 4) + '...' + currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
    : currency?.symbol
}

export function formatCrossChainCurrencySymbol(currency: CrossChainCurrency): string | undefined {
  const symbol = currency?.symbol?.toUpperCase()
  return symbol && symbol.length > 20
    ? symbol.slice(0, 4) + '...' + symbol.slice(symbol.length - 5, symbol.length)
    : symbol
}