export const AES_GCM_PARAMS: AesKeyGenParams = { name: 'AES-GCM', length: 256 }

/**
 * Imports raw bytes as an extractable AES-GCM key.
 *
 * @param bytes - Raw AES key material.
 * @returns Extractable AES-GCM CryptoKey.
 */
export async function importAesGcmKey(bytes: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
}

/**
 * AES-256-GCM encrypt.
 *
 * @param params.key - The CryptoKey to encrypt with.
 * @param params.iv - Initialization vector; unique per key.
 * @param params.data - Plaintext bytes to encrypt.
 * @param params.additionalData - Additional authenticated data.
 * @returns Ciphertext bytes with the GCM auth tag appended.
 */
export async function aesGcmEncrypt(params: {
  key: CryptoKey
  iv: BufferSource
  data: BufferSource
  additionalData: BufferSource
}): Promise<Uint8Array> {
  const { key, iv, data, additionalData } = params
  const ciphertext = await crypto.subtle.encrypt({ ...AES_GCM_PARAMS, iv, additionalData }, key, data)
  return new Uint8Array(ciphertext)
}

/**
 * AES-256-GCM decrypt.
 *
 * @param params.key - The CryptoKey to decrypt with.
 * @param params.iv - The initialization vector used at encryption time.
 * @param params.ciphertext - Ciphertext bytes with the GCM auth tag appended.
 * @param params.additionalData - The same additional authenticated data.
 * @returns The decrypted plaintext bytes.
 */
export async function aesGcmDecrypt(params: {
  key: CryptoKey
  iv: BufferSource
  ciphertext: BufferSource
  additionalData: BufferSource
}): Promise<Uint8Array> {
  const { key, iv, ciphertext, additionalData } = params
  const plaintext = await crypto.subtle.decrypt({ ...AES_GCM_PARAMS, iv, additionalData }, key, ciphertext)
  return new Uint8Array(plaintext)
}
