/**
 * Parses a raw on-chain string into a bigint, returning null for missing, empty, or malformed
 * values (`BigInt('')` would otherwise silently coerce to 0n).
 */
export function safeBigInt(value: string | undefined): bigint | null {
  if (!value) {
    return null
  }
  try {
    return BigInt(value)
  } catch {
    return null
  }
}
