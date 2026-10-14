import type { PlainMessage } from '@bufbuild/protobuf'
import { AuctionType, type Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { type LaunchProvenance, LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { parseCreatedAt } from '~/features/Toucan/Auction/utils/parseCreatedAt'
import { UNISWAP_CCA_LAUNCHPAD_ID, UNISWAP_LAUNCHPAD_NAME } from '~/pages/Launches/launchesModel'

// Auction fallback until canonical token provenance is served.
export function getLaunchProvenanceFromAuction({
  auction,
}: {
  auction: Pick<PlainMessage<Auction>, 'createdAt' | 'address' | 'auctionType'>
}): LaunchProvenance {
  const { timestampMs } = parseCreatedAt(auction.createdAt)
  return {
    launchpad: { id: UNISWAP_CCA_LAUNCHPAD_ID, name: UNISWAP_LAUNCHPAD_NAME },
    method: getAuctionLaunchMethod({ auction }),
    launchedAt: timestampMs === undefined ? undefined : new Date(timestampMs),
    auctionAddress: auction.address || undefined,
  }
}

/** Launched through the CCA protocol on Uniswap or pools.xyz; an unclassified auction has no page to offer. */
export function isCcaAuction({ auction }: { auction: Pick<Auction, 'auctionType'> }): boolean {
  const method = getAuctionLaunchMethod({ auction })
  return method === LaunchProvenanceMethod.CustomAuction || method === LaunchProvenanceMethod.CrowdLaunch
}

export function getAuctionLaunchMethod({ auction }: { auction: Pick<Auction, 'auctionType'> }): LaunchProvenanceMethod {
  switch (auction.auctionType) {
    case AuctionType.CUSTOM:
      return LaunchProvenanceMethod.CustomAuction
    case AuctionType.CROWD:
      return LaunchProvenanceMethod.CrowdLaunch
    default:
      return LaunchProvenanceMethod.Unknown
  }
}
