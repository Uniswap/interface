import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPossibleChainMatchFromSearchWord } from 'uniswap/src/utils/search/getPossibleChainMatchFromSearchWord'

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
  if (!searchQuery) {
    return {
      chainFilter: null,
      searchTerm: null,
    }
  }

  const sanitizedSearch = searchQuery.trim().replace(/\s+/g, ' ')
  const splitSearch = sanitizedSearch.split(' ')
  if (splitSearch.length === 0) {
    return {
      chainFilter: null,
      searchTerm: null,
    }
  }

  if (splitSearch.length === 1) {
    return {
      chainFilter: null,
      searchTerm: splitSearch[0] || null,
    }
  }

  const firstWord = splitSearch[0]?.toLowerCase()
  const lastWord = splitSearch[splitSearch.length - 1]?.toLowerCase()

  const firstWordChainMatch = firstWord ? getPossibleChainMatchFromSearchWord(firstWord, enabledChains) : undefined
  const lastWordChainMatch = lastWord ? getPossibleChainMatchFromSearchWord(lastWord, enabledChains) : undefined

  if (firstWordChainMatch) {
    // First word is chain, rest is search term
    const search = splitSearch.slice(1).join(' ').trim()
    return {
      chainFilter: firstWordChainMatch,
      searchTerm: search || null,
    }
  }

  if (lastWordChainMatch) {
    // Last word is chain, preceding words are search term
    const search = splitSearch.slice(0, -1).join(' ').trim()
    return {
      chainFilter: lastWordChainMatch,
      searchTerm: search || null,
    }
  }

  return {
    chainFilter: null,
    searchTerm: searchQuery,
  }
}
