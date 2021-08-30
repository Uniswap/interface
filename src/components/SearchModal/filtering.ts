import { TokenInfo } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { isAddress } from '../../utils'
import { Token, WETH9 } from '@uniswap/sdk-core'
import { USDC, USDT } from 'constants/tokens'

const alwaysTrue = () => true

/**
 * Create a filter function to apply to a token for whether it matches a particular search query
 * @param search the search query to apply to the token
 */
export function createTokenFilterFunction<T extends Token | TokenInfo>(search: string): (tokens: T) => boolean {
  const searchingAddress = isAddress(search)

  if (searchingAddress) {
    const lower = searchingAddress.toLowerCase()
    return (t: T) => ('isToken' in t ? searchingAddress === t.address : lower === t.address.toLowerCase())
  }

  const lowerSearchParts = search
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length > 0)

  if (lowerSearchParts.length === 0) return alwaysTrue

  const matchesSearch = (s: string): boolean => {
    const sParts = s
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0)

    return lowerSearchParts.every((p) => p.length === 0 || sParts.some((sp) => sp.startsWith(p) || sp.endsWith(p)))
  }

  return ({ name, symbol }: T): boolean => Boolean((symbol && matchesSearch(symbol)) || (name && matchesSearch(name)))
}

export function filterTokens<T extends Token | TokenInfo>(tokens: T[], search: string): T[] {
  return tokens.filter(createTokenFilterFunction(search))
}

export function useSortedTokensByQuery(tokens: Token[] | undefined, searchQuery: string, showOnlyTrumpCoins?:boolean): Token[] {
  return useMemo(() => {
    if (!tokens) {
      return []
    }

    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0)

    if (symbolMatch.length > 1) {
      return tokens
    }

    const exactMatches: Token[] = []
    const symbolSubtrings: Token[] = []
    const rest: Token[] = []

    // sort tokens by exact match -> subtring on symbol match -> rest
    tokens.map((token) => {
      if (token.symbol?.toLowerCase() === symbolMatch[0]) {
        return exactMatches.push(token)
      } else if (token.symbol?.toLowerCase().startsWith(searchQuery.toLowerCase().trim())) {
        return symbolSubtrings.push(token)
      } else {
        return rest.push(token)
      }
    })

    const allowedContracts = [
      '0x99d36e97676a68313ffdc627fd6b56382a2a08b6',
      '0x4d7beb770bb1c0ac31c2b3a3d0be447e2bf61013',
      WETH9[1].address,
      USDC.address,
      USDT.address,
    ]

    return [...exactMatches, ...symbolSubtrings, ...rest].filter((item: any) => {
      if (!showOnlyTrumpCoins) return !!item;
      const isTrumpApproved = allowedContracts.includes(item.address.toLowerCase())
      return isTrumpApproved
    })
  }, [tokens, searchQuery, showOnlyTrumpCoins])
}
