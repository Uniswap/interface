import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'

/**
 * Derives `length` bytes of key material using HKDF-SHA-256.
 *
 * A `salt` is required. Supply an independent per-derivation salt.
 * `info` binds the output to a context/application string.
 *
 * @param params - `ikm` (secret to derive from), `salt`, `info` (context
 *   binding), and `length` (number of bytes to derive).
 * @returns `length` bytes of derived key material.
 */
export function hkdfSha256(params: {
  ikm: Uint8Array
  salt: Uint8Array
  info: Uint8Array
  length: number
}): Uint8Array {
  const { ikm, salt, info, length } = params
  return hkdf(sha256, ikm, salt, info, length)
}
