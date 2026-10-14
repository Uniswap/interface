import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { isCcaAuction } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { useTokenDetailsAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctions'

/**
 * The auctions the selector surfaces: Uniswap custom auctions and pools.xyz crowd launches on the page
 * chain, once each. Claims stay on useTokenDetailsCustomAuctions; only custom auctions settle in-app.
 */
export function useTokenDetailsCcaAuctions(): PlainMessage<Auction>[] {
  const auctions = useTokenDetailsAuctions()
  return useMemo(() => auctions.filter((auction) => isCcaAuction({ auction })), [auctions])
}
