import { useMemo } from 'react'
import { buildTokenMarketCurrencyId } from '~/features/Toucan/hooks/tokenMarketPriceKeys'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { type PriceMap, useCurrencyKeyPriceMap } from '~/hooks/useCurrencyKeyPriceMap'

/**
 * Fetches USD prices for the auction tokens (the tokens being auctioned).
 * Used to compute FDV from actual market price for completed auctions.
 */
export function useAuctionTokenPrices(auctions: readonly EnrichedAuction[]): {
  priceMap: PriceMap
  loading: boolean
} {
  const currencyIds = useMemo(() => {
    const ids = new Set<string>()
    for (const { auction } of auctions) {
      if (auction?.tokenAddress && auction.chainId) {
        ids.add(buildTokenMarketCurrencyId({ chainId: auction.chainId, address: auction.tokenAddress }))
      }
    }
    return Array.from(ids)
  }, [auctions])

  return useCurrencyKeyPriceMap(currencyIds)
}
