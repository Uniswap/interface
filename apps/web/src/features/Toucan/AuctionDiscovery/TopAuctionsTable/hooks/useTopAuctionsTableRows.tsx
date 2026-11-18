/* oxlint-disable typescript/no-unnecessary-condition */
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TokenNameCell } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/components/TokenNameCell'
import type { AuctionSortField, TopAuctionsTableValue } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'
import { partitionHiddenAuctions } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/utils/filterAuctions'
import { sortAuctions } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/utils/sortAuctions'
import { buildTokenMarketPriceKey } from '~/features/Toucan/hooks/tokenMarketPriceKeys'
import { useAuctionTokenPrices } from '~/features/Toucan/hooks/useTopAuctions/useAuctionTokenPrices'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useEnrichedAuctions'
import { computeProjectedFdvTableValue } from '~/features/Toucan/utils/computeProjectedFdv'
import { getQuickLaunchExternalBidUrl } from '~/features/Toucan/utils/quickLaunchLinks'
import { getAuctionDetailsURL } from '~/utils/auctionDetailsUrl'

/** Builds the table rows, applies the active sort, and splits off the rows the table hides by default. */
export function useTopAuctionsTableRows({
  auctions,
  sortMethod,
  sortAscending,
}: {
  auctions?: readonly EnrichedAuction[]
  sortMethod: AuctionSortField | undefined
  sortAscending: boolean
}): { visibleRows: TopAuctionsTableValue[]; hiddenRows: TopAuctionsTableValue[] } {
  const { priceMap: auctionTokenPriceMap } = useAuctionTokenPrices(auctions ?? [])
  // QuickLaunch: flag gates only the cosmetic quick-launch treatment (row link-out, badge /
  // progress cell).
  const isQuickLaunchFlagEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)

  // Re-sorting the server order here would move loaded rows as later pages arrive.
  const topAuctionsTableValues = useMemo(() => {
    return (
      auctions
        ?.map((enrichedAuction, i) => {
          if (!enrichedAuction.auction) {
            return undefined
          }

          const auction = enrichedAuction.auction
          const auctionDetailsUrl = getAuctionDetailsURL({
            chainId: auction.chainId,
            auctionAddress: auction.address,
          })
          if (!auctionDetailsUrl) {
            return undefined
          }

          // Get auction token's market price for completed auctions
          const auctionTokenUsdPrice = auction.tokenAddress
            ? auctionTokenPriceMap[
                buildTokenMarketPriceKey({ chainId: auction.chainId, address: auction.tokenAddress })
              ]
            : undefined

          // Use new utilities to compute all values
          const projectedFdv = computeProjectedFdvTableValue({
            auction: enrichedAuction,
            auctionTokenUsdPrice,
          })

          // QuickLaunch: quick launches link out to the pools.trade bid page when one can be
          // constructed; every other auction (and any quick launch without a pools.trade URL)
          // keeps the web-app auction page.
          const poolsTradeUrl = getQuickLaunchExternalBidUrl({ enrichedAuction, isQuickLaunchFlagEnabled })

          return {
            index: i + 1,
            tokenName: <TokenNameCell auction={enrichedAuction} />,
            projectedFdv,
            auction: enrichedAuction,
            link: poolsTradeUrl ?? auctionDetailsUrl,
            linkTarget: poolsTradeUrl ? ('_blank' as const) : undefined,
            analytics: {
              elementName: ElementName.AuctionsTableRow,
              properties: {
                chain_id: auction.chainId,
                auction_address: auction.address,
                token_address: auction.tokenAddress,
                token_symbol: enrichedAuction?.auction?.tokenSymbol,
                verified: enrichedAuction.verified,
                auction_list_index: i,
                auction_list_length: auctions.length,
              },
            },
          }
        })
        .filter((auction) => auction !== undefined) ?? []
    )
  }, [auctions, auctionTokenPriceMap, isQuickLaunchFlagEnabled])

  // Apply sorting
  const sortedAuctionTableValues = useMemo(
    () =>
      sortMethod === undefined
        ? topAuctionsTableValues
        : sortAuctions({
            auctions: topAuctionsTableValues,
            sortMethod,
            sortAscending,
          }),
    [topAuctionsTableValues, sortMethod, sortAscending],
  )

  return useMemo(() => {
    const { visible, hidden } = partitionHiddenAuctions(sortedAuctionTableValues)
    return { visibleRows: visible, hiddenRows: hidden }
  }, [sortedAuctionTableValues])
}
