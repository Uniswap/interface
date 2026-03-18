import { TokenSortMethod } from '~/components/Tokens/constants'
import { giveExploreStatDefaultValue } from '~/state/explore'
import { TokenStat } from '~/state/explore/types'

/**
 * Comparator functions for client-side token sorting.
 * Default behavior: descending order (higher values first).
 */
export const TokenSortMethods: Record<TokenSortMethod, (a: TokenStat, b: TokenStat) => number> = {
  [TokenSortMethod.PRICE]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b.price?.value) - giveExploreStatDefaultValue(a.price?.value),
  [TokenSortMethod.DAY_CHANGE]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b.pricePercentChange1Day?.value) -
    giveExploreStatDefaultValue(a.pricePercentChange1Day?.value),
  [TokenSortMethod.HOUR_CHANGE]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b.pricePercentChange1Hour?.value) -
    giveExploreStatDefaultValue(a.pricePercentChange1Hour?.value),
  [TokenSortMethod.VOLUME]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b.volume?.value) - giveExploreStatDefaultValue(a.volume?.value),
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b.fullyDilutedValuation?.value) -
    giveExploreStatDefaultValue(a.fullyDilutedValuation?.value),
}

/**
 * Sorts tokens using the specified sort method.
 * @param tokens - Array of tokens to sort
 * @param sortMethod - The sorting method to use
 * @param sortAscending - Whether to sort in ascending order
 * @returns Sorted array of tokens
 */
export function sortTokens({
  tokens,
  sortMethod,
  sortAscending,
}: {
  tokens: TokenStat[]
  sortMethod: TokenSortMethod
  sortAscending: boolean
}): TokenStat[] {
  const sorted = [...tokens].sort(TokenSortMethods[sortMethod])
  return sortAscending ? sorted.reverse() : sorted
}
