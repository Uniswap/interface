// Patterns the wallet returns when it doesn't
// implement EIP-712 typed-data signing
const FALLBACK_TO_ETH_SIGN_PATTERNS = [
  /not (found|implemented)/i,
  /TrustWalletConnect.WCError error 1/,
  /Missing or invalid/,
]

export function shouldFallbackToEthSign(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }
  const message = (error as { message?: unknown }).message
  if (typeof message !== 'string') {
    return false
  }
  return FALLBACK_TO_ETH_SIGN_PATTERNS.some((pattern) => pattern.test(message))
}

// ethers' `TypedDataField` and viem's `TypedDataParameter`
// are both structurally `{ name: string; type: string }`
type StructuralField = { name: string; type: string }
type TypeFieldArrayLike = { fields: StructuralField[] }

// Both Trading API and Liquidity API formats are accepted; the latter
// wraps each type's field list inside a `{ fields: [...] }` object.
export type PermitTypes = Record<string, StructuralField[]> | Record<string, TypeFieldArrayLike>

/**
 * Type guard if a fields property is array like
 */
function isTypeFieldArrayLike(value: StructuralField[] | TypeFieldArrayLike): value is TypeFieldArrayLike {
  return 'fields' in value && Array.isArray(value.fields)
}

/**
 * Normalize permit types from either input format to the array form both
 * `_TypedDataEncoder` (ethers) and `hashTypedData` (viem) expect.
 */
export function normalizeTypes(types: PermitTypes): Record<string, StructuralField[]> {
  const normalized: Record<string, StructuralField[]> = {}
  for (const [key, value] of Object.entries(types)) {
    normalized[key] = isTypeFieldArrayLike(value) ? value.fields.map((f) => ({ name: f.name, type: f.type })) : value
  }
  return normalized
}
