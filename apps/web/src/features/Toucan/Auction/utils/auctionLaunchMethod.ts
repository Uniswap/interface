import type { PlainMessage } from '@bufbuild/protobuf'
import { AuctionType, type Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import {
  isAuctionLaunchMethod,
  isPoolsLaunchMethod,
  type LaunchProvenance,
  LaunchProvenanceMethod,
} from 'uniswap/src/features/dataApi/launchProvenance'
import { parseCreatedAt } from '~/features/Toucan/Auction/utils/parseCreatedAt'
import { POOLS_BASE_URL, POOLS_HOSTNAME } from '~/features/Toucan/utils/quickLaunchLinks'
import {
  POOLS_LAUNCHPAD_GROUP_ID,
  UNISWAP_BONDING_CURVE_LAUNCHPAD_ID,
  UNISWAP_CCA_LAUNCHPAD_ID,
  UNISWAP_LAUNCHPAD_NAME,
} from '~/pages/Launches/launchesModel'

const UNISWAP_CCA_LAUNCHPAD: LaunchProvenance['launchpad'] = {
  id: UNISWAP_CCA_LAUNCHPAD_ID,
  name: UNISWAP_LAUNCHPAD_NAME,
}

/** Crowd and Instant launches happen on pools.xyz; the label derives from the URL so the two cannot drift. */
const POOLS_LAUNCHPAD: LaunchProvenance['launchpad'] = {
  id: POOLS_LAUNCHPAD_GROUP_ID,
  name: POOLS_HOSTNAME,
  url: POOLS_BASE_URL,
}

/** Provenance for a token whose auction the page resolved, with no served attribution to go on. */
export function getLaunchProvenanceFromAuction({
  auction,
}: {
  auction: Pick<PlainMessage<Auction>, 'createdAt' | 'address' | 'auctionType'>
}): LaunchProvenance {
  const { timestampMs } = parseCreatedAt(auction.createdAt)
  const method = getAuctionLaunchMethod({ auction })
  return {
    launchpad: isPoolsLaunchMethod(method) ? POOLS_LAUNCHPAD : UNISWAP_CCA_LAUNCHPAD,
    method,
    launchedAt: timestampMs === undefined ? undefined : new Date(timestampMs),
    auctionAddress: auction.address || undefined,
  }
}

/**
 * Served provenance and the page's auction answer different halves of the question, so either alone
 * still produces a full record:
 *
 * - The launchpad only the backend registry knows — an instant launch or a third-party frontend has
 *   no Uniswap auction to infer it from, and a third-party CCA would otherwise read as "Uniswap".
 * - The mechanism and launch time only the auction knows definitively. The served method classifies
 *   a launch the page found no auction for, and covers a token the provenance backfill has not
 *   reached; where both speak, the auction's own type wins.
 *
 * Provenance names the token's earliest eligible launch while the page may have a later auction
 * selected, so a token whose auctions span launchpads is attributed to the first of them.
 */
export function mergeLaunchProvenance({
  served,
  auction,
}: {
  served: LaunchProvenance | undefined
  auction: Pick<PlainMessage<Auction>, 'createdAt' | 'address' | 'auctionType'> | undefined
}): LaunchProvenance | undefined {
  if (!served) {
    return auction ? getLaunchProvenanceFromAuction({ auction }) : undefined
  }
  if (!auction) {
    return { ...served, launchpad: resolveServedLaunchpad({ launchpad: served.launchpad, method: served.method }) }
  }
  const fromAuction = getLaunchProvenanceFromAuction({ auction })
  const method = fromAuction.method === LaunchProvenanceMethod.Unknown ? served.method : fromAuction.method
  return {
    ...fromAuction,
    method,
    launchpad: resolveServedLaunchpad({ launchpad: served.launchpad, method }),
  }
}

/**
 * The registry describes our own launches by mechanism — `uniswap-cca` is served as "Uniswap CCA
 * Crowd Launch" — and gives every one of them the same logo, which would restate the launch-method
 * cell and drop the Uniswap and pools.xyz marks. Those rows become the launchpad identity the rest
 * of the app uses; a third-party row is the only name, mark and site we have, so it is kept as served.
 */
function resolveServedLaunchpad({
  launchpad,
  method,
}: {
  launchpad: LaunchProvenance['launchpad']
  method: LaunchProvenanceMethod
}): LaunchProvenance['launchpad'] {
  if (launchpad.id === UNISWAP_CCA_LAUNCHPAD_ID || launchpad.id === UNISWAP_BONDING_CURVE_LAUNCHPAD_ID) {
    return isPoolsLaunchMethod(method) ? POOLS_LAUNCHPAD : UNISWAP_CCA_LAUNCHPAD
  }
  return launchpad
}

/** Launched through the CCA protocol on Uniswap or pools.xyz; an unclassified auction has no page to offer. */
export function isCcaAuction({ auction }: { auction: Pick<Auction, 'auctionType'> }): boolean {
  return isAuctionLaunchMethod(getAuctionLaunchMethod({ auction }))
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
