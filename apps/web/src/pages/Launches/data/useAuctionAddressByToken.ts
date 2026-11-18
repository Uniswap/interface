import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import {
  ListTopAuctionsRequest,
  TopAuctionsOrder,
  type ListTopAuctionsResponse,
} from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { useEffect } from 'react'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { logger } from 'utilities/src/logger/logger'
import { AUCTION_LIST_API_PAGE_SIZE } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { getAuctionTokenKey } from '~/features/Toucan/utils/launchesModel'

const EMPTY_AUCTION_ADDRESS_BY_TOKEN: ReadonlyMap<string, string> = new Map()

function selectAuctionAddressByToken(data: PlainMessage<ListTopAuctionsResponse>): ReadonlyMap<string, string> {
  const byToken = new Map<string, string>()
  for (const { auction } of data.auctions) {
    if (auction) {
      byToken.set(getAuctionTokenKey({ chainId: auction.chainId, tokenAddress: auction.tokenAddress }), auction.address)
    }
  }
  return byToken
}

/**
 * Auction contract address per launched token ({@link getAuctionTokenKey}), joined from the
 * auctions list. ListLaunches only carries the token address, but the auction bid page
 * (`/explore/auctions/:chainName/:auctionAddress`) is keyed by the auction contract address,
 * so CCA launches need this map to link to their bid page. Only non-graduated quick launches link there,
 * so one quick-launch-only page in lifecycle order covers the join up to {@link AUCTION_LIST_API_PAGE_SIZE}
 * such launches; past that, the lowest-volume ended ones fall back to token-page links.
 */
export function useAuctionAddressByToken(): ReadonlyMap<string, string> {
  const { data = EMPTY_AUCTION_ADDRESS_BY_TOKEN, error } = useQuery({
    ...auctionQueries.listTopAuctions({
      params: new ListTopAuctionsRequest({
        pageSize: AUCTION_LIST_API_PAGE_SIZE,
        quickLaunchOnly: true,
        order: TopAuctionsOrder.LIFECYCLE,
      }),
    }),
    select: selectAuctionAddressByToken,
  })

  // A failed join silently downgrades live CCA launches from bid-page links to token-page links,
  // so the log is the only failure signal.
  useEffect(() => {
    if (error) {
      logger.error(error, { tags: { file: 'useAuctionAddressByToken.ts', function: 'useAuctionAddressByToken' } })
    }
  }, [error])

  return data
}
