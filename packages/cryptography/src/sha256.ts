import { sha256 } from '@noble/hashes/sha2.js'

/**
 * Computes a SHA-256 digest synchronously.
 *
 * For high-throughput hashing prefer a hardware-accelerated async
 * `crypto.subtle.digest`; this sync pure-JS path is not for hot loops.
 * I don't see why we don't always prefer `crypto.subtle`. Just moving
 * this for now to keep it where it's already used.
 *
 * @param data - The bytes to hash.
 * @returns The 32-byte SHA-256 digest.
 */
export function sha256Sync(data: Uint8Array): Uint8Array {
  return sha256(data)
}
