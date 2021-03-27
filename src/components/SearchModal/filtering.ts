import { isAddress } from '../../utils'
import { Token } from '@uniswap/sdk'

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
  // .sort((t0: Token, t1: Token) => {
  //   if (t0.symbol && matchesSearch(t0.symbol) && t1.symbol && !matchesSearch(t1.symbol)) {
  //     return -1
  //   }
  //   if (t0.symbol && !matchesSearch(t0.symbol) && t1.symbol && matchesSearch(t1.symbol)) {
  //     return 1
  //   }
  //   return 0
  // })
}
