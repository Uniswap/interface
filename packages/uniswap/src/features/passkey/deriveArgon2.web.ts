import { argon2id } from '@noble/hashes/argon2.js'
import { ARGON2_PARAMS } from 'uniswap/src/features/passkey/pinCrypto'

/**
 * Argon2id web implementation, pure JS
 *
 * @param pin - User-entered recovery PIN, UTF-8 encoded
 * @param salt1 - 16-byte random salt
 * @returns 32-byte Argon2id-derived pinKey
 */
export async function deriveArgon2(pin: string, salt1: Uint8Array): Promise<Uint8Array> {
  const pinBytes = new TextEncoder().encode(pin)
  return argon2id(pinBytes, salt1, ARGON2_PARAMS)
}
