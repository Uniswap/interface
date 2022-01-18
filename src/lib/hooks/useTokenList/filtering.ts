import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { TokenInfo } from '@uniswap/token-lists'

import { isAddress } from '../../../utils'

const alwaysTrue = () => true

/** Creates a filter function that filters tokens that do not match the query. */
export function getTokenFilter<T extends Token | TokenInfo>(query: string): (token: T | NativeCurrency) => boolean {
  const searchingAddress = isAddress(query)

  if (searchingAddress) {
    const address = searchingAddress.toLowerCase()
    return (t: T | NativeCurrency) => 'address' in t && address === t.address.toLowerCase()
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

  return ({ name, symbol }: T | NativeCurrency): boolean => Boolean((symbol && match(symbol)) || (name && match(name)))
}
