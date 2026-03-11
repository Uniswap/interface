import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import {
  buildContractInputForAddress,
  type PriceMap,
  useTokenMarketPrices,
} from '~/components/Toucan/hooks/useTokenMarketPrices'
import type { EnrichedAuction } from '~/state/explore/topAuctions/useTopAuctions'

/**
 * Fetches USD prices for the auction tokens (the tokens being auctioned).
 * Used to compute FDV from actual market price for completed auctions.
 */
export function useAuctionTokenPrices(auctions: readonly EnrichedAuction[]): {
  priceMap: PriceMap
  loading: boolean
} {
  const contracts = useMemo(() => {
    if (!auctions.length) {
      return []
    }

    const contractMap = auctions.reduce((acc: { [key: string]: GraphQLApi.ContractInput }, auction) => {
      if (auction.auction?.tokenAddress && auction.auction.chainId) {
        const key = `${auction.auction.chainId}-${auction.auction.tokenAddress}`
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!acc[key]) {
          acc[key] = buildContractInputForAddress({
            chainId: auction.auction.chainId,
            address: auction.auction.tokenAddress,
          })
        }
      }
      return acc
    }, {})
    return Object.values(contractMap)
  }, [auctions])

  return useTokenMarketPrices(contracts)
}
