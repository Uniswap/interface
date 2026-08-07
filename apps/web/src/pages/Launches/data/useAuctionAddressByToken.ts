import { useQuery } from '@tanstack/react-query'
import { ListTopAuctionsRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useEffect, useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { logger } from 'utilities/src/logger/logger'
import { getAuctionTokenKey } from '~/pages/Launches/launchesModel'

// Same "whole list" page size the Explore auctions surface uses (see useTopAuctions).
const AUCTIONS_PAGE_SIZE = 200

/**
 * Auction contract address per launched token ({@link getAuctionTokenKey}), joined from the
 * auctions list. ListLaunches only carries the token address, but the auction bid page
 * (`/explore/auctions/:chainName/:auctionAddress`) is keyed by the auction contract address,
 * so live CCA launches need this map to link to their bid page.
 */
export function useAuctionAddressByToken(): ReadonlyMap<string, string> {
  const { data, error } = useQuery(
    auctionQueries.listTopAuctions({ params: new ListTopAuctionsRequest({ pageSize: AUCTIONS_PAGE_SIZE }) }),
  )

  // A failed join silently downgrades live CCA launches from bid-page links to token-page links,
  // so the log is the only failure signal.
  useEffect(() => {
    if (error) {
      logger.error(error, { tags: { file: 'useAuctionAddressByToken.ts', function: 'useAuctionAddressByToken' } })
    }
  }, [error])

  return useMemo(() => {
    const byToken = new Map<string, string>()
    for (const { auction } of data?.auctions ?? []) {
      if (auction) {
        byToken.set(
          getAuctionTokenKey({ chainId: auction.chainId, tokenAddress: auction.tokenAddress }),
          auction.address,
        )
      }
    }
    return byToken
  }, [data?.auctions])
}
