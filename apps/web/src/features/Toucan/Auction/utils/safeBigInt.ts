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

/**
 * Parses an unsigned decimal string (block numbers, raw token amounts) into a bigint, returning null
 * for anything else: `BigInt` would accept `''` as 0n, negatives, hex, and exponent forms.
 */
export function parseNonNegativeBigInt(value: string | undefined): bigint | null {
  return value !== undefined && /^\d+$/.test(value) ? BigInt(value) : null
}
