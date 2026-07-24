import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'

/**
 * Filters ranked multichain tokens by search string (name, symbol, multichainId, address).
 * v2's TokenProject has no separate "project/entity name" field (e.g. "Circle" for USDC) —
 * only description/homepage/twitter/logo — so project-name matching from the v1 path is gone.
 */
export function filterMultichainTokensBySearchString(
  tokens: RankedMultichainToken[],
  filterString: string,
): RankedMultichainToken[] {
  if (!filterString) {
    return tokens
  }
  const lowercaseFilter = filterString.toLowerCase()
  return tokens.filter((token) => {
    const mc = token.multichainToken
    if (!mc) {
      return false
    }
    const nameMatch = mc.name.toLowerCase().includes(lowercaseFilter)
    const symbolMatch = mc.symbol.toLowerCase().includes(lowercaseFilter)
    const multichainIdMatch = mc.multichainId.toLowerCase().includes(lowercaseFilter)
    const addressMatch = Object.values(mc.addresses).some((address) =>
      normalizeTokenAddressForCache(address).includes(lowercaseFilter),
    )
    return nameMatch || symbolMatch || multichainIdMatch || addressMatch
  })
}
