export function isAuctionCompleted({
  endBlock,
  blockNumber,
}: {
  endBlock?: string
  blockNumber: bigint | undefined
}): boolean {
  if (!endBlock || blockNumber === undefined) {
    return false
  }

  return blockNumber >= BigInt(endBlock)
}
