import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { TokenInfo } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { BalancesResult, PricesResult } from 'state/connection/hooks'

/** Sorts currency amounts (descending). */
function balanceComparator(a?: CurrencyAmount<Currency>, b?: CurrencyAmount<Currency>) {
  return valueComparator(a, b) // defaults to price of 1, so this will just compare the balances directly
}

/** Sorts currency amounts by value (descending). */
function valueComparator(a?: CurrencyAmount<Currency>, b?: CurrencyAmount<Currency>, aPrice?: number, bPrice?: number) {
  const aBalance: number = parseFloat(a?.toFixed(2) ?? '0')
  const bBalance: number = parseFloat(b?.toFixed(2) ?? '0')
  if (a && b) {
    return aBalance * (aPrice ?? 1) > bBalance * (bPrice ?? 1)
      ? -1
      : aBalance * (aPrice ?? 1) === bBalance * (bPrice ?? 1)
      ? 0
      : 1
  } else if (aBalance && aBalance * (aPrice ?? 1) > 0) {
    return -1
  } else if (bBalance && bBalance * (bPrice ?? 1) > 0) {
    return 1
  }
  return 0
}

/** Sorts tokens by USD Value (descending), then currency amount (descending), then safety, then symbol (ascending). */
export function tokenComparator(balances: BalancesResult, prices: PricesResult, a: Token, b: Token) {
  // Sorts by USD value
  const valueComparison = valueComparator(
    balances[a.address],
    balances[b.address],
    prices?.[a.address],
    prices?.[b.address]
  )
  if (valueComparison !== 0) return valueComparison

  // Sorts by balances
  const balanceComparison = balanceComparator(balances[a.address], balances[b.address])
  if (balanceComparison !== 0) return balanceComparison

  // Sorts by symbol
  if (a.symbol && b.symbol) {
    return a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1
  }

  return -1
}

/** Sorts tokens by query, giving precedence to exact matches and partial matches. */
export function useSortTokensByQuery<T extends Token | TokenInfo>(query: string, tokens?: T[]): T[] {
  return useMemo(() => {
    if (!tokens) {
      return []
    }

    const matches = query
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0)

    if (matches.length > 1) {
      return tokens
    }

    const exactMatches: T[] = []
    const symbolSubtrings: T[] = []
    const rest: T[] = []

    // sort tokens by exact match -> subtring on symbol match -> rest
    const trimmedQuery = query.toLowerCase().trim()
    tokens.map((token) => {
      const symbol = token.symbol?.toLowerCase()
      if (symbol === matches[0]) {
        return exactMatches.push(token)
      } else if (symbol?.startsWith(trimmedQuery)) {
        return symbolSubtrings.push(token)
      } else {
        return rest.push(token)
      }
    })

    return [...exactMatches, ...symbolSubtrings, ...rest]
  }, [tokens, query])
}
