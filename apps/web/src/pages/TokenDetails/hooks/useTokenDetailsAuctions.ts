import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import { useMemo } from 'react'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

/** All returned auctions on the page chain, counted once per address. */
export function useTokenDetailsAuctions(): PlainMessage<Auction>[] {
  const { auctionSource, chainId } = useTDPStore((s) => ({
    auctionSource: s.auctionSource,
    chainId: s.currencyChainId,
  }))
  return useMemo(() => {
    if (auctionSource.status !== TokenDetailsSourceState.Found) {
      return []
    }
    const seen = new Set<string>()
    return auctionSource.auctions.filter((auction) => {
      if (auction.chainId !== chainId) {
        return false
      }
      const address = normalizeAddress(auction.address, AddressStringFormat.Lowercase)
      if (seen.has(address)) {
        return false
      }
      seen.add(address)
      return true
    })
  }, [auctionSource, chainId])
}
