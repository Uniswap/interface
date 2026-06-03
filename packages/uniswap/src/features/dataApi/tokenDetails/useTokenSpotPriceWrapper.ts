/**
 * Feature-flag wrapper for token spot price.
 *
 * Delegates to the implementation provided by TokenPriceContext,
 * which switches between legacy and centralized based on a feature flag.
 * Only the selected implementation is called — no overfetching.
 */
import type { UseTokenSpotPriceOptions } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useTokenPriceHooks } from 'uniswap/src/features/prices/TokenPriceContext'
import type { CurrencyId } from 'uniswap/src/types/currency'

export function useTokenSpotPrice(
  currencyId: CurrencyId | undefined,
  options?: UseTokenSpotPriceOptions,
): number | undefined {
  return useTokenPriceHooks().useTokenSpotPrice(currencyId, options)
}
