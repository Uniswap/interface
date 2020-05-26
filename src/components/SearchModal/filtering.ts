import { isAddress } from '../../utils'
import { Pair, Token } from '@uniswap/sdk'

export function filterTokens(tokens: Token[], search: string): Token[] {
  if (search.length === 0) return tokens

  const searchingAddress = isAddress(search)

  if (searchingAddress) {
    return tokens.filter(token => token.address === searchingAddress)
  }

  const lowerSearchParts = searchingAddress ? [] : search.toLowerCase().split(/\s+/)

  const matchesSearch = (s: string): boolean => {
    const sParts = s.toLowerCase().split(/\s+/)

    return lowerSearchParts.every(p => p.length === 0 || sParts.some(sp => sp.startsWith(p)))
  }

  return tokens.filter(token => {
    const { symbol, name } = token

    return matchesSearch(symbol) || matchesSearch(name)
  })
}

export function filterPairs(pairs: Pair[], search: string): Pair[] {
  if (search.trim().length === 0) return pairs

  const addressSearch = isAddress(search)
  if (addressSearch) {
    return pairs.filter(p => {
      return (
        p.token0.address === addressSearch ||
        p.token1.address === addressSearch ||
        p.liquidityToken.address === addressSearch
      )
    })
  }

  const lowerSearch = search.toLowerCase()
  return pairs.filter(pair => {
    const pairExpressionA = `${pair.token0.symbol}/${pair.token1.symbol}`.toLowerCase()
    if (pairExpressionA.startsWith(lowerSearch)) return true
    const pairExpressionB = `${pair.token1.symbol}/${pair.token0.symbol}`.toLowerCase()
    if (pairExpressionB.startsWith(lowerSearch)) return true
    return filterTokens([pair.token0, pair.token1], search).length > 0
  })
}
