import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'

interface MatchResult {
  chainId: UniverseChainId | null
  searchQuery: string
}

/**
 * Finds a matching chain ID based on the provided search query.
 * If found, returns the chain ID and the search query with the chain reference removed.
 *
 * @param searchQuery - The search query to check for a chain match
 * @param enabledChains - Array of enabled chain IDs to search within
 * @returns The matching chain ID and the search query with the chain reference removed if a match is found,
 * otherwise null chainId and the original search query
 */
export function getPossibleChainMatchFromSearch(searchQuery: string, enabledChains: UniverseChainId[]): MatchResult {
  // Skip empty search queries
  if (!searchQuery) {
    return { chainId: null, searchQuery }
  }

  // Lowercase the search query for case-insensitive comparison
  const lowercasedSearchQuery = searchQuery.toLowerCase()

  // Start with no match
  let matchResult: MatchResult = { chainId: null, searchQuery }
  let matchResultStartsWithAlias = false

  for (const chainId of enabledChains) {
    // Skip testnet chains or if we've already found a match that starts with an alias
    if (isTestnetChain(chainId) || matchResultStartsWithAlias) {
      continue
    }

    // Get collection of search aliases from chain info
    const chainInfo = getChainInfo(chainId)
    const nativeCurrencyName = chainInfo.nativeCurrency.name.toLowerCase()
    const interfaceName = chainInfo.interfaceName.toLowerCase()
    const explicitSearchAliases = chainInfo.searchAliases?.map((alias: string) => alias.toLowerCase()) ?? []

    // Search all aliases for a match at the start or end of the search query, largest match first
    const chainAliases = [nativeCurrencyName, interfaceName, ...explicitSearchAliases].sort(
      (a, b) => b.length - a.length,
    )
    const matchingName = chainAliases.find(
      (alias) => lowercasedSearchQuery.startsWith(`${alias} `) || lowercasedSearchQuery.endsWith(` ${alias}`),
    )

    // If a matching name is found, set the result to the chain ID and the search query with the chain reference removed,
    // noting if this match is a start or end alias
    if (matchingName) {
      const startIndex = lowercasedSearchQuery.indexOf(matchingName)
      const queryWithoutChainReference =
        startIndex === 0 ? searchQuery.substring(matchingName.length) : searchQuery.substring(0, startIndex)
      matchResult = {
        chainId,
        searchQuery: sanitizeSearchQuery(queryWithoutChainReference),
      }
      matchResultStartsWithAlias = startIndex === 0
    }
  }

  return matchResult
}

export function sanitizeSearchQuery(searchQuery: string): string {
  return searchQuery.trim().replace(/\s+/g, ' ')
}
