import { Currency } from '@uniswap/sdk-core'
import { doesTokenMatchSearchTerm } from 'uniswap/src/utils/search/doesTokenMatchSearchTerm'

/**
 * Filters tokens based on search criteria (name, symbol, address, chain name).
 * This is a pure utility function for client-side filtering.
 *
 * @param tokens - Array of tokens to filter
 * @param searchTerm - Search term to match against
 * @param enabledChains - Array of enabled chain IDs to search within
 * @returns Filtered array of tokens that match the search criteria
 */
export function filterTokensBySearch<T extends { currencyInfo: { currencyId: string; currency: Currency } | null }>({
  tokens,
  searchTerm,
}: {
  tokens: T[] | undefined
  searchTerm: string | undefined | null
}): T[] | undefined {
  const trimmedSearchTerm = searchTerm?.trim()
  if (!trimmedSearchTerm) {
    return tokens
  }

  return tokens?.filter((token) => {
    return doesTokenMatchSearchTerm(token, trimmedSearchTerm)
  })
}
