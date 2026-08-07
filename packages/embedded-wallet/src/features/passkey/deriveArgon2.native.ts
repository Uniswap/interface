import type { DeriveArgon2Params } from '@universe/embedded-wallet/src/features/passkey/pinCrypto'
import { hexToUint8, uint8ToHex } from '@universe/encoding'
import argon2 from 'react-native-argon2'

/**
 * Native Argon2id (libargon2 in Swift/Kotlin). The working set lives on the
 * native heap; JS-thread implementations were too slow here. Callers pass the
 * same argon2Params on every platform so the derived key matches web.
 *
 * @returns 32-byte Argon2id-derived pinKey
 */
export async function deriveArgon2(params: DeriveArgon2Params): Promise<Uint8Array> {
  const { pin, salt1, argon2Params } = params
  const result = await argon2(pin, uint8ToHex(salt1), {
    mode: 'argon2id',
    memory: argon2Params.m,
    iterations: argon2Params.t,
    parallelism: argon2Params.p,
    hashLength: 32,
    saltEncoding: 'hex',
  })
  return hexToUint8(result.rawHash)
}
