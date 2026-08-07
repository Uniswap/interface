import type { DeriveArgon2Params } from '@universe/embedded-wallet/src/features/passkey/pinCrypto'
import { utf8ToUint8 } from '@universe/encoding'

/**
 * Argon2id web implementation, WASM
 *
 * @param params - Derviation parameters
 * @returns 32-byte Argon2id-derived pinKey
 */
export async function deriveArgon2(params: DeriveArgon2Params): Promise<Uint8Array> {
  const { pin, salt1, argon2Params } = params
  // Lazy-load to keep out of the entry chunk
  const { argon2id } = await import('hash-wasm')
  return argon2id({
    password: utf8ToUint8(pin),
    salt: salt1,
    iterations: argon2Params.t,
    memorySize: argon2Params.m,
    parallelism: argon2Params.p,
    hashLength: 32,
    outputType: 'binary',
  })
}
