import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  getPossibleChainMatchFromSearch,
  sanitizeSearchQuery,
} from 'uniswap/src/utils/search/getPossibleChainMatchFromSearch'

/**
 * Parses a search query to extract chain filter and search term.
 * Handles patterns like "eth dai", "dai eth", "ethereum usdc", etc.
 *
 * @param searchQuery - The search query string
 * @param enabledChains - Array of enabled chain IDs to search within
 * @returns An object containing the parsed `chainFilter` and `searchTerm`
 */
export function parseChainFromTokenSearchQuery(
  searchQuery: string | null,
  enabledChains: UniverseChainId[],
): {
  chainFilter: UniverseChainId | null
  searchTerm: string | null
} {
  if (!searchQuery || searchQuery.trim() === '') {
    return {
      chainFilter: null,
      searchTerm: null,
    }
  }

  const sanitizedSearch = sanitizeSearchQuery(searchQuery)

  // Skip if the search is not more than one word
  const splitSearch = sanitizedSearch.split(' ')
  if (splitSearch.length < 2) {
    return {
      chainFilter: null,
      searchTerm: sanitizedSearch,
    }
  }

  // Use a matching chain filter if available and update the search query to remove the chain reference
  const { chainId, searchQuery: searchTerm } = getPossibleChainMatchFromSearch(sanitizedSearch, enabledChains)
  return {
    chainFilter: chainId,
    searchTerm,
  }
}
