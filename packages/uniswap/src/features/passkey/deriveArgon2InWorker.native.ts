import argon2 from 'react-native-argon2'
import { ARGON2_PARAMS } from 'uniswap/src/features/passkey/pinCrypto'

function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0')
  }
  return hex
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return bytes
}

/**
 * Native Argon2id via `react-native-argon2` (libargon2 in Swift/Kotlin). The 256 MB
 * working set lives on the native heap — JS-thread pure-JS `@noble/hashes/argon2`
 * OOMs iOS before completing. Params mirror {@link ARGON2_PARAMS} so the derived
 * key matches the one produced by the web graduation worker.
 */
export async function deriveArgon2InWorker(pin: string, salt1: Uint8Array): Promise<Uint8Array> {
  const result = await argon2(pin, bytesToHex(salt1), {
    mode: 'argon2id',
    memory: ARGON2_PARAMS.m,
    iterations: ARGON2_PARAMS.t,
    parallelism: ARGON2_PARAMS.p,
    hashLength: 32,
    saltEncoding: 'hex',
  })
  return hexToBytes(result.rawHash)
}
