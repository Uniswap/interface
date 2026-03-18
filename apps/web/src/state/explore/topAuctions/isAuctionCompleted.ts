export function isAuctionCompleted({
  endBlock,
  blockNumber,
}: {
  endBlock?: string
  blockNumber: bigint | null | undefined
}): boolean {
  if (!endBlock || blockNumber === undefined || blockNumber === null) {
    return false
  }

  return blockNumber >= BigInt(endBlock)
}
