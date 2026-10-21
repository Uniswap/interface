import { mayShowNowTradingCard } from '~/features/Toucan/Auction/utils/auctionDisplayVisibility'
import type { AuctionDisplayState } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'

interface ShouldShowTokenLaunchedBannerParams {
  isAuctionEnded: boolean
  isTokenProvenanceEnabled: boolean
  isGraduated: boolean
  /** Undefined while provenance is off. */
  displayState: AuctionDisplayState | undefined
  tradingRestrictedUntilTge: boolean
}

export function shouldShowTokenLaunchedBanner({
  isAuctionEnded,
  isTokenProvenanceEnabled,
  isGraduated,
  displayState,
  tradingRestrictedUntilTge,
}: ShouldShowTokenLaunchedBannerParams): boolean {
  if (!isAuctionEnded) {
    return false
  }
  // Provenance replaces the ordinary trading banner, not failure or trading-restriction guidance.
  if (!isTokenProvenanceEnabled || !isGraduated || tradingRestrictedUntilTge) {
    return true
  }
  // Yield whenever the card's slot is filled, skeleton included, so the two never render together.
  return !mayShowNowTradingCard({ state: displayState, tradingRestrictedUntilTge })
}

interface IsTokenLaunchTradeAvailableParams {
  claimBlock: string | undefined
  currentBlockNumber: number | undefined
  hasLbpStrategyAddress: boolean
  isGraduated: boolean
  // Whether the post-auction LBP migration has actually run (data-api lbp_migration_tx_hash).
  hasMigrated: boolean
}

export function isTokenLaunchTradeAvailable({
  claimBlock,
  currentBlockNumber,
  hasLbpStrategyAddress,
  isGraduated,
  hasMigrated,
}: IsTokenLaunchTradeAvailableParams): boolean {
  if (!isGraduated) {
    return false
  }

  if (!hasLbpStrategyAddress) {
    return true
  }

  // For LBP auctions the tradeable pool only exists once migration has actually run — not merely
  // once the scheduled migration block has passed, since migrate() is permissionless and may lag.
  if (!hasMigrated) {
    return false
  }

  // Migration is always scheduled after the claim block (migrationBlock = endBlock + delay,
  // claimBlock = endBlock), so a migrated auction has necessarily passed its claim block. This
  // guard is defensive and also covers any future where that ordering changes.
  const claimBlockNumber = claimBlock ? Number(claimBlock) : undefined
  return (
    claimBlockNumber === undefined ||
    (currentBlockNumber !== undefined && Number.isFinite(claimBlockNumber) && currentBlockNumber >= claimBlockNumber)
  )
}

interface IsTokenLaunchTradeLiveParams {
  // Whether the auction status (graduation / LBP migration / claim block) permits trading.
  isTradeAvailableFromStatus: boolean
  // Whether a live market price exists for the launched token, i.e. a pool with liquidity is
  // actually trading. Status can report "tradeable" while no pool exists — e.g. a graduated
  // auction that committed 0% to LP never creates a pool — so a live price is required before
  // we surface "Trade now" and link out to the (otherwise un-tradeable) token page.
  hasLiveMarketPrice: boolean
}

export function isTokenLaunchTradeLive({
  isTradeAvailableFromStatus,
  hasLiveMarketPrice,
}: IsTokenLaunchTradeLiveParams): boolean {
  return isTradeAvailableFromStatus && hasLiveMarketPrice
}

interface GetTokenLaunchTradeAvailabilityBlockParams {
  claimBlock: string | undefined
  hasLbpStrategyAddress: boolean
  // Scheduled migration block from data-api (lbp_migration_block), as a block-number string.
  migrationBlock: string | undefined
}

export function getTokenLaunchTradeAvailabilityBlock({
  claimBlock,
  hasLbpStrategyAddress,
  migrationBlock,
}: GetTokenLaunchTradeAvailabilityBlockParams): number | undefined {
  if (!hasLbpStrategyAddress) {
    return undefined
  }

  const claimBlockNumber = claimBlock ? Number(claimBlock) : undefined
  const migrationBlockNumber = migrationBlock === undefined ? undefined : Number(migrationBlock)
  const targetBlocks = [claimBlockNumber, migrationBlockNumber].filter(
    (block): block is number => block !== undefined && Number.isFinite(block),
  )

  return targetBlocks.length > 0 ? Math.max(...targetBlocks) : undefined
}
