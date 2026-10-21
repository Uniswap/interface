import type { UniverseChainId } from '@universe/chains'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import type { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import type { TokenProvenanceAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import { shouldShowAuctionOnlyLayout } from '~/features/Toucan/Auction/utils/auctionDisplayVisibility'
import { AuctionDisplayPhase, PoolAvailability } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'

export type ProvenanceAnalyticsEventName =
  | AuctionEventName.AuctionBannerViewed
  | AuctionEventName.ProvenanceModuleViewed
  | AuctionEventName.ChartEmptyStateViewed
  | AuctionEventName.TokenDetailsToAuctionDetailsClicked
  | AuctionEventName.TokenDetailsToLaunchesClicked
  | AuctionEventName.AuctionDetailsToTokenDetailsClicked

export type ProvenanceAnalyticsContext = Pick<
  TokenProvenanceAnalyticsProperties,
  'entry_point' | 'auction_count' | 'has_auction_history' | 'destination'
>

export interface ProvenanceAnalyticsInput extends ProvenanceAnalyticsContext {
  surface: TokenProvenanceAnalyticsProperties['surface']
  chainId: UniverseChainId
  launchMethod: LaunchProvenanceMethod | undefined
  phase: AuctionDisplayPhase
  poolAvailability: PoolAvailability
}

export function getAnalyticsLaunchMethod(
  method: LaunchProvenanceMethod | undefined,
): NonNullable<TokenProvenanceAnalyticsProperties['launch_method']> {
  switch (method) {
    case LaunchProvenanceMethod.CustomAuction:
      return 'custom'
    case LaunchProvenanceMethod.CrowdLaunch:
      return 'crowd'
    case LaunchProvenanceMethod.InstantLaunch:
      return 'instant'
    case LaunchProvenanceMethod.ThirdParty:
      return 'third_party'
    default:
      return 'unknown'
  }
}

// Only the two Uniswap CCA methods are auction types; every other launch reports 'unknown'.
const AUCTION_TYPE: Record<LaunchProvenanceMethod, TokenProvenanceAnalyticsProperties['auction_type']> = {
  [LaunchProvenanceMethod.CustomAuction]: 'custom',
  [LaunchProvenanceMethod.CrowdLaunch]: 'crowd',
  [LaunchProvenanceMethod.InstantLaunch]: 'unknown',
  [LaunchProvenanceMethod.ThirdParty]: 'unknown',
  [LaunchProvenanceMethod.Unknown]: 'unknown',
}

const AUCTION_PHASE: Record<AuctionDisplayPhase, TokenProvenanceAnalyticsProperties['auction_phase']> = {
  [AuctionDisplayPhase.Loading]: 'loading',
  [AuctionDisplayPhase.Unknown]: 'unknown',
  [AuctionDisplayPhase.Upcoming]: 'upcoming',
  [AuctionDisplayPhase.Live]: 'live',
  [AuctionDisplayPhase.Ended]: 'ended',
}

const POOL_AVAILABILITY: Record<PoolAvailability, TokenProvenanceAnalyticsProperties['pool_availability']> = {
  [PoolAvailability.HasPool]: 'has_pool',
  [PoolAvailability.Loading]: 'loading',
  [PoolAvailability.Error]: 'error',
  [PoolAvailability.NoPool]: 'no_pool',
}

/**
 * Allowlisting mapper for the Token Provenance events. It reads only the display-state enums it
 * names; extra wallet, bid or claim fields are discarded before calling the shared analytics client.
 */
export function buildProvenanceAnalyticsProperties({
  surface,
  chainId,
  launchMethod,
  phase,
  poolAvailability,
  entry_point,
  auction_count,
  has_auction_history,
  destination,
}: ProvenanceAnalyticsInput): TokenProvenanceAnalyticsProperties {
  return {
    surface,
    chain_id: chainId,
    auction_type: launchMethod ? AUCTION_TYPE[launchMethod] : 'unknown',
    auction_phase: AUCTION_PHASE[phase],
    pool_availability: POOL_AVAILABILITY[poolAvailability],
    // ADP navigation describes the destination TDP layout using the same rule as the TDP itself.
    page_layout: shouldShowAuctionOnlyLayout({ launchMethod, phase, poolAvailability }) ? 'auction_only' : 'trading',
    launch_method: getAnalyticsLaunchMethod(launchMethod),
    ...(entry_point !== undefined && { entry_point }),
    ...(auction_count !== undefined && { auction_count }),
    ...(has_auction_history !== undefined && { has_auction_history }),
    ...(destination !== undefined && { destination }),
  }
}
