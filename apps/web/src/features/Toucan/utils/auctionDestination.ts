import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { isPoolsLaunchMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { getAuctionLaunchMethod } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { getPoolsTokenPageUrl } from '~/features/Toucan/utils/quickLaunchLinks'
import { getAuctionDetailsURL } from '~/utils/auctionDetailsUrl'

export interface AuctionDestination {
  href: string
  /** pools.xyz launches link out of the app; Uniswap auctions route to the in-app details page. */
  isExternal: boolean
}

/**
 * Where an auction's details live. Every surface that offers to open an auction routes through this,
 * so the same auction never lands on pools.xyz from one entry point and the Uniswap ADP from another.
 * Undefined when neither page can be addressed — a quick launch off a pools.xyz chain has no page.
 */
export function getAuctionDestination({
  auction,
  chainId,
}: {
  auction: PlainMessage<Auction>
  chainId: number
}): AuctionDestination | undefined {
  if (isPoolsLaunchMethod(getAuctionLaunchMethod({ auction }))) {
    const href = getPoolsTokenPageUrl({ chainId, tokenAddress: auction.tokenAddress })
    return href === undefined ? undefined : { href, isExternal: true }
  }
  const href = getAuctionDetailsURL({ chainId, auctionAddress: auction.address })
  return href === undefined ? undefined : { href, isExternal: false }
}
