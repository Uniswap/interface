// biome-ignore-all lint/suspicious/noBitwiseOperators: Hash function requires bitwise ops

/**
 * cyrb53 - fast, well-distributed 53-bit hash
 * No dependencies, excellent distribution for avatar generation
 */
export function hashString(str: string, seed = 0): bigint {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return BigInt(h2 >>> 0) * BigInt(0x100000000) + BigInt(h1 >>> 0)
}
