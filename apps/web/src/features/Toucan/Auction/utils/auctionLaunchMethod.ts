import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import {
  getAuctionLaunchMethod,
  isAuctionLaunchMethod,
  isPoolsLaunchMethod,
  type LaunchProvenance,
  LaunchProvenanceMethod,
} from 'uniswap/src/features/dataApi/launchProvenance'
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

/**
 * Whether a token counts as a launch is the backend's call alone: an auction run on an existing
 * token is attributed only once it graduates without the token having traded first, so a resolved
 * auction with nothing served is never attributed here.
 *
 * Provenance names the token's earliest eligible launch while the page may have a later auction
 * selected — a Crowd Launch re-auctioned as a Custom one — so the served method wins. The auction's
 * type only classifies one of our own rows served without a method, which normalizes to ThirdParty;
 * a third-party row keeps it.
 */
export function mergeLaunchProvenance({
  served,
  auction,
}: {
  served: LaunchProvenance | undefined
  auction: Pick<PlainMessage<Auction>, 'address' | 'auctionType'> | undefined
}): LaunchProvenance | undefined {
  if (!served) {
    return undefined
  }
  if (!auction) {
    return { ...served, launchpad: resolveServedLaunchpad({ launchpad: served.launchpad, method: served.method }) }
  }
  const method =
    served.method === LaunchProvenanceMethod.ThirdParty && isUniswapLaunchpad(served.launchpad)
      ? getAuctionLaunchMethod({ auction })
      : served.method
  return {
    ...served,
    method,
    launchpad: resolveServedLaunchpad({ launchpad: served.launchpad, method }),
    auctionAddress: auction.address || undefined,
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
  if (isUniswapLaunchpad(launchpad)) {
    return isPoolsLaunchMethod(method) ? POOLS_LAUNCHPAD : UNISWAP_CCA_LAUNCHPAD
  }
  return launchpad
}

function isUniswapLaunchpad({ id }: LaunchProvenance['launchpad']): boolean {
  return id === UNISWAP_CCA_LAUNCHPAD_ID || id === UNISWAP_BONDING_CURVE_LAUNCHPAD_ID
}

/** Launched through the CCA protocol on Uniswap or pools.xyz; an unclassified auction has no page to offer. */
export function isCcaAuction({ auction }: { auction: Pick<Auction, 'auctionType'> }): boolean {
  return isAuctionLaunchMethod(getAuctionLaunchMethod({ auction }))
}
