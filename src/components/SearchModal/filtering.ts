import { isAddress } from '../../utils'
import { Pair, Token } from 'dxswap-sdk'
import { useMemo } from 'react'
import { TokenInfo } from '@uniswap/token-lists'

const alwaysTrue = () => true

export function createTokenFilterFunction<T extends Token | TokenInfo>(search: string): (tokens: T) => boolean {
  const searchingAddress = isAddress(search)

  if (searchingAddress) {
    const lower = searchingAddress.toLowerCase()
    return (t: T) => ('isToken' in t ? searchingAddress === t.address : lower === t.address.toLowerCase())
  }

  const lowerSearchParts = search
    .toLowerCase()
    .split(/\s+/)
    .filter(s => s.length > 0)

  if (lowerSearchParts.length === 0) return alwaysTrue

  const matchesSearch = (s: string): boolean => {
    const sParts = s
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)

    return lowerSearchParts.every(p => p.length === 0 || sParts.some(sp => sp.startsWith(p) || sp.endsWith(p)))
  }

  return ({ name, symbol }: T): boolean => Boolean((symbol && matchesSearch(symbol)) || (name && matchesSearch(name)))
}

export function filterTokens(tokens: Token[], search: string): Token[] {
  if (search.length === 0) return tokens

  const searchingAddress = isAddress(search)

  if (searchingAddress) {
    return tokens.filter(token => token.address === searchingAddress)
  }

  const lowerSearchParts = search
    .toLowerCase()
    .split(/\s+/)
    .filter(s => s.length > 0)

  if (lowerSearchParts.length === 0) {
    return tokens
  }

  const matchesSearch = (s: string): boolean => {
    const sParts = s
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)

    return lowerSearchParts.every(p => p.length === 0 || sParts.some(sp => sp.startsWith(p) || sp.endsWith(p)))
  }

  return tokens.filter(token => {
    const { symbol, name } = token

    return (symbol && matchesSearch(symbol)) || (name && matchesSearch(name))
  })
}

export function filterPairs(pairs: Pair[], search: string): Pair[] {
  if (search.length === 0) return pairs

  const searchingAddress = isAddress(search)

  if (searchingAddress) {
    return pairs.filter(pair => Pair.getAddress(pair.token0, pair.token1) === searchingAddress)
  }

  const lowerSearchParts = search
    .toLowerCase()
    .split(/\s+/)
    .filter(s => s.length > 0)

  if (lowerSearchParts.length === 0) {
    return pairs
  }

  const matchesSearch = (s: string): boolean => {
    const sParts = s
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)

    return lowerSearchParts.every(p => p.length === 0 || sParts.some(sp => sp.startsWith(p) || sp.endsWith(p)))
  }

  return pairs.filter(pair => {
    const { token0, token1 } = pair

    return (
      (token0.symbol && matchesSearch(token0.symbol)) ||
      (token1.symbol && matchesSearch(token1.symbol)) ||
      (token0.name && matchesSearch(token0.name)) ||
      (token1.name && matchesSearch(token1.name)) ||
      (token0.symbol &&
        token1.symbol &&
        (matchesSearch(token0.symbol + token1.symbol) || matchesSearch(`${token0.symbol}/${token1.symbol}`)))
    )
  })
}

export function useSortedTokensByQuery(tokens: Token[] | undefined, searchQuery: string): Token[] {
  return useMemo(() => {
    if (!tokens) {
      return []
    }

    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)

    if (symbolMatch.length > 1) {
      return tokens
    }

    const exactMatches: Token[] = []
    const symbolSubtrings: Token[] = []
    const rest: Token[] = []

    // sort tokens by exact match -> subtring on symbol match -> rest
    tokens.map(token => {
      if (token.symbol?.toLowerCase() === symbolMatch[0]) {
        return exactMatches.push(token)
      } else if (token.symbol?.toLowerCase().startsWith(searchQuery.toLowerCase().trim())) {
        return symbolSubtrings.push(token)
      } else {
        return rest.push(token)
      }
    })

    return [...exactMatches, ...symbolSubtrings, ...rest]
  }, [tokens, searchQuery])
}
