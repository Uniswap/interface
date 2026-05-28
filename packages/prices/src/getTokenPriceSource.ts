import type { QueryClient } from '@tanstack/react-query'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import type { PriceSource, TokenPriceData } from '@universe/prices/src/types'

/**
 * Reads the current cached price for a token and returns its `source` tag.
 * Pure cache lookup — safe to call from non-React contexts (sagas, callbacks).
 * Returns `undefined` when no price has been written to the cache for this token.
 */
export function getTokenPriceSource(
  queryClient: QueryClient,
  chainId: number,
  address: string,
): PriceSource | undefined {
  return queryClient.getQueryData<TokenPriceData>(priceKeys.token(chainId, address))?.source
}
