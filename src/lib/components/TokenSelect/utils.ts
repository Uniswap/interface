import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { TokenInfo } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { useTokenBalances } from 'state/wallet/hooks'
import { isAddress } from 'utils'

/** Sorts currency amounts (descending). */
function balanceComparator(a?: CurrencyAmount<Currency>, b?: CurrencyAmount<Currency>) {
  if (a && b) {
    return a.greaterThan(b) ? -1 : a.equalTo(b) ? 0 : 1
  } else if (a?.greaterThan('0')) {
    return -1
  } else if (b?.greaterThan('0')) {
    return 1
  }
  return 0
}

/** Sorts tokens by currency amount (descending), then symbol (ascending). */
export function tokenComparator(balances: ReturnType<typeof useTokenBalances>, a: Token, b: Token) {
  // Sorts by balances
  const balanceComparison = balanceComparator(balances[a.address], balances[b.address])
  if (balanceComparison !== 0) return balanceComparison

  // Sorts by symbol
  if (a.symbol && b.symbol) {
    return a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1
  }

  return -1
}

const alwaysTrue = () => true

/** Creates a filter function that filters tokens that do not match the query. */
export function createTokenFilterFunction<T extends Token | TokenInfo>(query: string): (tokens: T) => boolean {
  const searchingAddress = isAddress(query)

  if (searchingAddress) {
    const lower = searchingAddress.toLowerCase()
    return (t: T) => ('isToken' in t ? searchingAddress === t.address : lower === t.address.toLowerCase())
  }

  const queryParts = query
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length > 0)

  if (queryParts.length === 0) return alwaysTrue

  const match = (s: string): boolean => {
    const parts = s
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0)

    return queryParts.every((p) => p.length === 0 || parts.some((sp) => sp.startsWith(p) || sp.endsWith(p)))
  }

  return ({ name, symbol }: T): boolean => Boolean((symbol && match(symbol)) || (name && match(name)))
}

/** Sorts tokens by query, giving precedence to exact matches and partial matches. */
export function useSortedTokensByQuery<T extends Token | TokenInfo>(tokens: T[] | undefined, query: string): T[] {
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
    tokens.map((token) => {
      if (token.symbol?.toLowerCase() === matches[0]) {
        return exactMatches.push(token)
      } else if (token.symbol?.toLowerCase().startsWith(query.toLowerCase().trim())) {
        return symbolSubtrings.push(token)
      } else {
        return rest.push(token)
      }
    })

    return [...exactMatches, ...symbolSubtrings, ...rest]
  }, [tokens, query])
}
