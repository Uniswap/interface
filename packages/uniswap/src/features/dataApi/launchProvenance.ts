import type { PlainMessage } from '@bufbuild/protobuf'
import { LaunchMethod, type TokenLaunchProvenance } from '@uniswap/client-data-api/dist/data/v2/types_pb'

export enum LaunchProvenanceMethod {
  CustomAuction = 'CUSTOM_AUCTION',
  CrowdLaunch = 'CROWD_LAUNCH',
  InstantLaunch = 'INSTANT_LAUNCH',
  /** A launchpad the served provenance names without classifying its mechanism. */
  ThirdParty = 'THIRD_PARTY',
  /** The source carried no classification (e.g. `AuctionType.UNSPECIFIED`). Neither renders a method row today. */
  Unknown = 'UNKNOWN',
}

/** Crowd and Instant launches are created and traded on pools.xyz, so their link-outs and explainers point there. */
export function isPoolsLaunchMethod(method: LaunchProvenanceMethod): boolean {
  return method === LaunchProvenanceMethod.CrowdLaunch || method === LaunchProvenanceMethod.InstantLaunch
}

interface LaunchProvenanceLaunchpad {
  /** Registry slug — the id ListLaunches filters accept (`pons`, `uniswap-cca`, `pools`, …). */
  id: string
  name: string
  logoUrl?: string
  /** The launchpad's own site; undefined when there is nowhere to link out to. */
  url?: string
}

/**
 * Normalized presentation data, independent of the API wire contract.
 */
export interface LaunchProvenance {
  launchpad: LaunchProvenanceLaunchpad
  method: LaunchProvenanceMethod
  /** Undefined when the source carries no parseable launch time. */
  launchedAt?: Date
  /** Auction contract when the source identifies a Uniswap CCA launch. */
  auctionAddress?: string
}

// Exhaustive, so a LaunchMethod added to the proto fails the build here rather than being silently
// classified. The lookup still falls back at runtime: a wire value this client's enum does not know
// arrives as a raw number and misses the map entirely.
const LAUNCH_METHODS: Record<LaunchMethod, LaunchProvenanceMethod> = {
  [LaunchMethod.CROWD]: LaunchProvenanceMethod.CrowdLaunch,
  [LaunchMethod.CUSTOM]: LaunchProvenanceMethod.CustomAuction,
  [LaunchMethod.INSTANT]: LaunchProvenanceMethod.InstantLaunch,
  [LaunchMethod.UNSPECIFIED]: LaunchProvenanceMethod.ThirdParty,
}

/**
 * GetToken's launch provenance, normalized. The served method classifies the mechanism, not the
 * launchpad: a third-party frontend running a CCA still reports Crowd or Custom, and only a
 * launchpad whose mechanism the registry does not record falls back to ThirdParty.
 *
 * Undefined whenever the backend has nothing to attribute — the flag is off, the token predates the
 * backfill, or the registry entry was incomplete — so every caller keeps its pre-provenance path.
 */
export function toLaunchProvenance({
  provenance,
}: {
  provenance: PlainMessage<TokenLaunchProvenance> | undefined
}): LaunchProvenance | undefined {
  if (!provenance?.launchpad?.id) {
    return undefined
  }
  const { id, name, logoUrl } = provenance.launchpad
  return {
    launchpad: { id, name: name || id, logoUrl: logoUrl || undefined },
    // oxlint-disable-next-line typescript/no-unnecessary-condition -- unknown wire values miss the map at runtime
    method: LAUNCH_METHODS[provenance.launchMethod] ?? LaunchProvenanceMethod.ThirdParty,
  }
}

/** The served method names a Continuous Clearing Auction, so the token has one without asking GetAuction. */
export function isAuctionLaunchMethod(method: LaunchProvenanceMethod | undefined): boolean {
  return method === LaunchProvenanceMethod.CustomAuction || method === LaunchProvenanceMethod.CrowdLaunch
}
