import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'

/**
 * Unique row identity for a ranked token. Grouped tokens use their real
 * multichainId. Ungrouped tokens carry the backend's `''` sentinel (no
 * canonicalizer group), so every single would collide on the same key —
 * fall back to their one (chainId, address) deployment instead, which is
 * unique by construction. Sorted for determinism if a malformed row ever
 * carries several addresses without a multichainId.
 */
export function multichainTokenKey(token: RankedMultichainToken): string {
  const mc = token.multichainToken
  if (mc?.multichainId) {
    return mc.multichainId
  }
  const entries = Object.entries(mc?.addresses ?? {}).sort(([a], [b]) => Number(a) - Number(b))
  const [chainId, address] = entries[0] ?? ['unknown', 'unknown']
  return `${chainId}:${address}`
}
