export enum LaunchProvenanceMethod {
  CustomAuction = 'CUSTOM_AUCTION',
  CrowdLaunch = 'CROWD_LAUNCH',
  InstantLaunch = 'INSTANT_LAUNCH',
  /** Reserved for non-Uniswap launchpad provenance; no adapter produces it today. */
  ThirdParty = 'THIRD_PARTY',
  /** The source carried no classification (e.g. `AuctionType.UNSPECIFIED`). Neither renders a method row today. */
  Unknown = 'UNKNOWN',
}

/** Crowd and Instant launches are created and traded on pools.xyz, so their link-outs and explainers point there. */
export function isPoolsLaunchMethod(method: LaunchProvenanceMethod): boolean {
  return method === LaunchProvenanceMethod.CrowdLaunch || method === LaunchProvenanceMethod.InstantLaunch
}

interface LaunchProvenanceLaunchpad {
  /** Registry slug — the id ListLaunches filters accept (`pons`, `uniswap-cca`, …). */
  id: string
  name: string
  logoUrl?: string
}

/**
 * Normalized presentation data, independent of the API wire contract. Canonical token provenance
 * needs a generated client adapter after CONS-3228 enables serving.
 */
export interface LaunchProvenance {
  launchpad: LaunchProvenanceLaunchpad
  method: LaunchProvenanceMethod
  /** Undefined when the source carries no parseable launch time. */
  launchedAt?: Date
  /** Auction contract when the source identifies a Uniswap CCA launch. */
  auctionAddress?: string
}
