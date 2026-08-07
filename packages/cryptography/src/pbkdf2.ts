import { AES_GCM_PARAMS } from './aes'

// Right now this is only used in the keyring. We want to keep
// settings for backward compatibility until we move away.
export const PBKDF2_PARAMS: Omit<Pbkdf2Params, 'salt'> & { hash: string } = {
  name: 'PBKDF2',
  iterations: 100000,
  hash: 'SHA-256',
}

/**
 * Derives a CryptoKey from `password` using PBKDF2, backed by Web Crypto.
 *
 * `salt`, `iterations`, and `hash` are supplied by the caller so per-record
 * values round-trip on decryption. The key is extractable; the caller picks
 * its algorithm (`derivedKeyType`) and `keyUsages`.
 *
 * @param params - PBKDF2 inputs (`password`, `salt`, `iterations`,
 * `hash`) and the target key spec (`derivedKeyType`, `keyUsages`).
 * @returns The derived (extractable) CryptoKey.
 */
export async function derivePbkdf2(params: {
  password: BufferSource
  salt: BufferSource
  iterations: number
  hash: string
}): Promise<CryptoKey> {
  const { password, salt, iterations, hash } = params
  const baseKey = await crypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash }, baseKey, AES_GCM_PARAMS, true, [
    'encrypt',
    'decrypt',
  ])
}
