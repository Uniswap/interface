import { Currency, Token } from '@uniswap/sdk-core'

/**
 * Checks if a token matches a search term.
 *
 * @param token - The token to check
 * @param searchTerm - The search term to match against
 * @returns True if the token matches the search term, false otherwise
 */
export function doesTokenMatchSearchTerm(
  token: { currencyInfo: { currencyId: string; currency: Currency } | null },
  searchTerm: string,
): boolean {
  if (!searchTerm || !searchTerm.trim()) {
    return true
  }

  const lowercaseSearch = searchTerm.toLowerCase()

  const currencyInfo = token.currencyInfo
  if (!currencyInfo) {
    return false
  }
  const currency = currencyInfo.currency

  // Search by token name
  const nameIncludesSearch = currency.name?.toLowerCase().includes(lowercaseSearch)

  // Search by token symbol
  const symbolIncludesSearch = currency.symbol?.toLowerCase().includes(lowercaseSearch)

  // Search by token address (normalized for consistency with explore page)
  const addressIncludesSearch =
    currency instanceof Token ? currency.address.toLowerCase().includes(lowercaseSearch) : false

  return Boolean(nameIncludesSearch || symbolIncludesSearch || addressIncludesSearch)
}
