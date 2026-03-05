const SCALE = 10_000n

export function calculateBidFillFraction(amount: string, amountFilled: string): number {
  const amountBigInt = BigInt(amount)

  if (amountBigInt === 0n) {
    return 0
  }

  const amountFilledBigInt = BigInt(amountFilled)
  const clampedFilled = amountFilledBigInt > amountBigInt ? amountBigInt : amountFilledBigInt

  const scaledFraction = (clampedFilled * SCALE) / amountBigInt

  return Number(scaledFraction) / Number(SCALE)
}
