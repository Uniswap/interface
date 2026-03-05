/**
 * Computes the fraction of tokens cleared (totalCleared / auctionAmount)
 * @param totalCleared - Total tokens cleared from checkpoint (bigint string)
 * @param auctionAmount - Total tokens being auctioned (bigint string)
 * @returns Decimal value between 0 and 1 representing fraction cleared
 */
export function computeTotalClearedFraction({
  totalCleared,
  auctionAmount,
}: {
  totalCleared: string | undefined
  auctionAmount: string | undefined
}): number {
  if (!totalCleared || !auctionAmount) {
    return 0
  }

  try {
    const cleared = BigInt(totalCleared)
    const total = BigInt(auctionAmount)

    if (total === 0n) {
      return 0
    }

    // Use scaled division for precision, then convert to decimal
    // Scale by 1e18 to maintain precision in integer math
    const scale = 10n ** 18n
    const scaledFraction = (cleared * scale) / total
    const fraction = Number(scaledFraction) / Number(scale)

    // Clamp to [0, 1] range
    return Math.min(1, Math.max(0, fraction))
  } catch {
    return 0
  }
}
