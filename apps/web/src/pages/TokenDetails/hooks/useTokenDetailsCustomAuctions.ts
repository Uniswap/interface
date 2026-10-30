import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { getAuctionLaunchMethod, LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { useTokenDetailsAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctions'

/** Claim cards only support custom CCA launches; only those settle in-app. */
export function useTokenDetailsCustomAuctions(): PlainMessage<Auction>[] {
  const auctions = useTokenDetailsAuctions()
  return useMemo(
    () => auctions.filter((auction) => getAuctionLaunchMethod({ auction }) === LaunchProvenanceMethod.CustomAuction),
    [auctions],
  )
}
