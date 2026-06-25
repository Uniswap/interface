interface ShouldShowTokenLaunchedBannerParams {
  isAuctionEnded: boolean
}

export function shouldShowTokenLaunchedBanner({ isAuctionEnded }: ShouldShowTokenLaunchedBannerParams): boolean {
  return isAuctionEnded
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
