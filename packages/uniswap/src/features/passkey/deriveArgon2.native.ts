import { hexToUint8, uint8ToHex } from '@universe/encoding'
import argon2 from 'react-native-argon2'
import { ARGON2_PARAMS } from 'uniswap/src/features/passkey/pinCrypto'

/**
 * Native Argon2id (libargon2 in Swift/Kotlin). The working set lives on
 * the native heap. JS-thread pure-JS `@noble/hashes/argon2` was too slow.
 * Shared params so the derived key matches the one produced by web.
 *
 * @param pin - User-entered recovery PIN, UTF-8 encoded
 * @param salt1 - 16-byte random salt
 * @returns 32-byte Argon2id-derived pinKey
 */
export async function deriveArgon2(pin: string, salt1: Uint8Array): Promise<Uint8Array> {
  const result = await argon2(pin, uint8ToHex(salt1), {
    mode: 'argon2id',
    memory: ARGON2_PARAMS.m,
    iterations: ARGON2_PARAMS.t,
    parallelism: ARGON2_PARAMS.p,
    hashLength: 32,
    saltEncoding: 'hex',
  })
  return hexToUint8(result.rawHash)
}
