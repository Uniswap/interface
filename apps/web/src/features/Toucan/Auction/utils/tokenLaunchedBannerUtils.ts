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
  migrationBlock: bigint | undefined
}

export function isTokenLaunchTradeAvailable({
  claimBlock,
  currentBlockNumber,
  hasLbpStrategyAddress,
  isGraduated,
  migrationBlock,
}: IsTokenLaunchTradeAvailableParams): boolean {
  if (!isGraduated) {
    return false
  }

  if (!hasLbpStrategyAddress) {
    return true
  }

  if (currentBlockNumber === undefined || migrationBlock === undefined) {
    return false
  }

  const claimBlockNumber = claimBlock ? Number(claimBlock) : undefined
  const hasReachedClaimBlock =
    claimBlockNumber === undefined || (Number.isFinite(claimBlockNumber) && currentBlockNumber >= claimBlockNumber)

  return BigInt(currentBlockNumber) >= migrationBlock && hasReachedClaimBlock
}

interface GetTokenLaunchTradeAvailabilityBlockParams {
  claimBlock: string | undefined
  hasLbpStrategyAddress: boolean
  migrationBlock: bigint | undefined
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
