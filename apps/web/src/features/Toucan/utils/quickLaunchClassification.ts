import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'

/**
 * Backend quick-launch classification. Replaces the old client-side fingerprint heuristic: whether
 * an auction is a quick launch is now decided server-side (data-api classifies from on-chain params
 * via the SDK's canonical `isQuickLaunch` matcher) and surfaced as the `is_quick_launch` field on
 * `data.v1.Auction` — a single source of truth shared with the create flow. The field ships in
 * `@uniswap/client-data-api` 0.0.129 (proto field 46), generated as camelCase `isQuickLaunch`, so we
 * read it directly off the typed message; the proto3 `bool` default (`false`) covers pre-marker
 * auctions.
 *
 * SECURITY: this is a cosmetic / discovery descriptor ONLY (badge, Explore filter, progress
 * treatment). Because a quick launch is reproducible by construction, the flag is forgeable, so it
 * MUST NOT gate suppression of Blockaid / token-protection warnings (see LP-1076).
 */

/** Minimal shape carrying the backend classification field — satisfied by both `Auction` and the detail-page auction. */
type QuickLaunchClassifiable = Pick<Auction, 'isQuickLaunch'>

/** Core reader: usable anywhere the raw auction message (or detail-page auction) is available. */
export function isQuickLaunchAuctionData(auction: QuickLaunchClassifiable | null | undefined): boolean {
  return auction?.isQuickLaunch === true
}

export function isQuickLaunchAuction(enriched: EnrichedAuction): boolean {
  return isQuickLaunchAuctionData(enriched.auction)
}
