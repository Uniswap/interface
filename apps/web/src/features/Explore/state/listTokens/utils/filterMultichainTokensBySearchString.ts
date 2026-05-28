import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'

/** Filters multichain tokens by search string (name, symbol, address, project name). */
export function filterMultichainTokensBySearchString(
  tokens: MultichainToken[],
  filterString: string,
): MultichainToken[] {
  if (!filterString) {
    return tokens
  }
  const lowercaseFilter = filterString.toLowerCase()
  return tokens.filter((token) => {
    const nameMatch = token.name.toLowerCase().includes(lowercaseFilter)
    const symbolMatch = token.symbol.toLowerCase().includes(lowercaseFilter)
    const projectMatch = token.projectName.toLowerCase().includes(lowercaseFilter)
    const multichainIdMatch = token.multichainId.toLowerCase().includes(lowercaseFilter)
    const addressMatch = token.chainTokens.some((ct) =>
      normalizeTokenAddressForCache(ct.address).includes(lowercaseFilter),
    )
    return nameMatch || symbolMatch || projectMatch || multichainIdMatch || addressMatch
  })
}
