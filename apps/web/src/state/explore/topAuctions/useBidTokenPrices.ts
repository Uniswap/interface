import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import {
  buildContractInputForAddress,
  type PriceMap,
  useTokenMarketPrices,
} from '~/components/Toucan/hooks/useTokenMarketPrices'
import type { AuctionWithCurrencyInfo } from '~/state/explore/topAuctions/useTopAuctions'

/**
 * Fetches USD prices for all bid tokens used in the provided auctions.
 */
export function useBidTokenPrices(auctions: readonly AuctionWithCurrencyInfo[]): {
  priceMap: PriceMap
  loading: boolean
} {
  const contracts = useMemo(() => {
    if (!auctions.length) {
      return []
    }

    const contractMap = auctions.reduce((acc: { [key: string]: GraphQLApi.ContractInput }, auction) => {
      if (auction.auction?.currency && auction.auction.chainId) {
        const key = `${auction.auction.chainId}-${auction.auction.currency}`
        // Deduplicate by chainId-currency combination
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!acc[key]) {
          acc[key] = buildContractInputForAddress({
            chainId: auction.auction.chainId,
            address: auction.auction.currency,
            resolveNativeAddress: true,
          })
        }
      }
      return acc
    }, {})
    return Object.values(contractMap)
  }, [auctions])

  return useTokenMarketPrices(contracts)
}
