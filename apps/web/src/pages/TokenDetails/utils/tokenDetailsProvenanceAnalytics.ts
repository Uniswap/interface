import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { TokenProvenanceAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import {
  type ProvenanceAnalyticsEventName,
  type ProvenanceAnalyticsContext,
  buildProvenanceAnalyticsProperties,
  getAnalyticsLaunchMethod,
} from '~/features/Toucan/Auction/utils/provenanceAnalytics'
import type { TokenDetailsAuctionDisplay } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'

/** The TDP's provenance events all read the same display slice; without a chain there is no auction to report. */
export function sendTokenDetailsProvenanceEvent({
  eventName,
  display,
  ...context
}: {
  // Every event here is tagged `surface: 'tdp'`, so the ADP-named one must not be reachable.
  eventName: Exclude<ProvenanceAnalyticsEventName, AuctionEventName.AuctionDetailsToTokenDetailsClicked>
  display: TokenDetailsAuctionDisplay
} & ProvenanceAnalyticsContext): void {
  const properties = getTokenDetailsProvenanceProperties(display, context)
  if (properties) {
    sendAnalyticsEvent(eventName, properties)
  }
}

export function getTokenDetailsProvenanceProperties(
  display: TokenDetailsAuctionDisplay,
  context: ProvenanceAnalyticsContext,
): TokenProvenanceAnalyticsProperties | undefined {
  const { auction, chainId, launchMethod, phase, poolAvailability, provenance, tokenAddress } = display
  if (chainId === undefined) {
    return undefined
  }
  return {
    ...buildProvenanceAnalyticsProperties({
      surface: 'tdp',
      chainId,
      launchMethod,
      phase,
      poolAvailability,
      tokenAddress: tokenAddress ?? auction?.tokenAddress,
      auctionAddress: auction?.address,
      launchpadId: provenance?.launchpad.id,
      ...context,
    }),
    // The auction classifies the page's layout; provenance classifies the launch itself, which is
    // the only classification a token with no auction on this page has.
    launch_method: getAnalyticsLaunchMethod(provenance?.method ?? launchMethod),
  }
}
