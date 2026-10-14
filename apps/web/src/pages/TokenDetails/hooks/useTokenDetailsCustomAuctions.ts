import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { getLaunchProvenanceFromAuction } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { useTokenDetailsAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctions'

/** Claim cards only support custom CCA launches; only those settle in-app. */
export function useTokenDetailsCustomAuctions(): PlainMessage<Auction>[] {
  const auctions = useTokenDetailsAuctions()
  return useMemo(
    () =>
      auctions.filter(
        (auction) => getLaunchProvenanceFromAuction({ auction }).method === LaunchProvenanceMethod.CustomAuction,
      ),
    [auctions],
  )
}
