import { useMemo } from 'react'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { AuctionWithCurrencyInfo } from '~/state/explore/topAuctions/useTopAuctions'

/**
 * Hook that fetches currency info for all unique bid tokens across auctions.
 * Bid tokens are the currencies used for bidding (e.g., WETH, USDC).
 *
 * @param auctions - Array of auctions to extract bid tokens from
 * @returns Map of bid token address to CurrencyInfo
 */
export function useBidTokenInfos(auctions: readonly AuctionWithCurrencyInfo[]): Map<string, Maybe<CurrencyInfo>> {
  // Extract unique bid tokens with their chain IDs
  const uniqueBidTokens = useMemo(() => {
    const tokens = new Map<string, { chainId: number; address: string }>()
    auctions.forEach((auction) => {
      if (auction.auction?.currency && auction.auction.chainId) {
        const key = auction.auction.currency
        if (!tokens.has(key)) {
          tokens.set(key, {
            chainId: auction.auction.chainId,
            address: auction.auction.currency,
          })
        }
      }
    })
    return Array.from(tokens.values())
  }, [auctions])

  // Build currency IDs for batch fetching
  const currencyIds = useMemo(
    () => uniqueBidTokens.map(({ chainId, address }) => buildCurrencyId(chainId, address)),
    [uniqueBidTokens],
  )

  // Batch fetch currency info
  const currencyInfos = useCurrencyInfos(currencyIds)

  // Create map of address -> currency info
  return useMemo(() => {
    const map = new Map<string, Maybe<CurrencyInfo>>()
    uniqueBidTokens.forEach(({ address }, index) => {
      map.set(address, currencyInfos[index])
    })
    return map
  }, [uniqueBidTokens, currencyInfos])
}
