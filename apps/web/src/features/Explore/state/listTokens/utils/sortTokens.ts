import { TokenSortMethod } from '~/components/Tokens/constants'
import { giveExploreStatDefaultValue } from '~/features/Explore/state'
import type { TokenStat } from '~/types/explore'

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
