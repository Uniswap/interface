import { doesTokenMatchSearchTerm } from 'uniswap/src/utils/search/doesTokenMatchSearchTerm'
import type { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'

/**
 * Filters tokens based on search criteria (name, symbol, address, chain name).
 * Supports multichain TokenData shape (top-level currencyInfo).
 *
 * @param tokens - Array of tokens to filter
 * @param searchTerm - Search term to match against
 * @returns Filtered array of tokens that match the search criteria
 */
export function filterTokensBySearch<T extends Pick<TokenData, 'currencyInfo'>>({
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

  return tokens?.filter((token) => doesTokenMatchSearchTerm({ currencyInfo: token.currencyInfo }, trimmedSearchTerm))
}
