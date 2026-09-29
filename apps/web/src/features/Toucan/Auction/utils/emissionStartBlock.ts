export interface ParsedAuctionStepLike {
  mps?: number | string
  startBlock?: string
  endBlock?: string
}

/**
 * The pre-bid window runs from auction start until the first step that emits tokens (mps > 0).
 * Returns the block where pre-bidding ends: the start of the first emitting step, or the auction
 * start block when there is no pre-bid window (steps missing or emission starts immediately).
 */
export function computePreBidEndBlock(
  steps: ParsedAuctionStepLike[] | undefined,
  startBlock: string | undefined,
): string | undefined {
  if (!startBlock) {
    return undefined
  }

  if (!steps || steps.length === 0) {
    return startBlock
  }

  const hasMps = (step: ParsedAuctionStepLike) => {
    if (step.mps === undefined) {
      return false
    }
    const mpsNumber = typeof step.mps === 'string' ? Number(step.mps) : step.mps
    return Number.isFinite(mpsNumber) && mpsNumber > 0
  }

  if (hasMps(steps[0])) {
    return startBlock
  }

  const firstStepWithMps = steps.find(hasMps)
  return firstStepWithMps?.startBlock ?? startBlock
}
