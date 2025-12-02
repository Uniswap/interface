import { logger } from 'utilities/src/logger/logger'

// Module self-reference to enable mocking of internal function calls in tests.
// TODO: figure out how to rewrite `Keyring.test.ts` to avoid doing this.
import * as CryptoModule from 'wallet/src/features/wallet/Keyring/crypto'

export const PBKDF2_PARAMS: Omit<Pbkdf2Params, 'salt'> & { hash: string } = {
  name: 'PBKDF2',
  iterations: 100000,
  hash: 'SHA-256',
}

export const AES_GCM_PARAMS: AesKeyGenParams = { name: 'AES-GCM', length: 256 }

// TODO: improve encoding/decoding
export const encodeForStorage = (payload: ArrayBuffer): string => payload.toString()
export const decodeFromStorage = (payload: string): Uint8Array =>
  new Uint8Array(payload.split(',').map((x) => Number(x)))

// An encrypted secret with associated metadata required for decryption
export type SecretPayload = {
  ciphertext?: string
  iv: string
  salt: string
  name: string
  iterations: number
  hash: string
}
export function generateNewSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}
export function generateNewIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12))
}
export function generateNew256BitRandomBuffer(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32))
}

interface EncryptParams {
  plaintext: string
  encryptionKey: CryptoKey
  iv: Uint8Array
  additionalData?: string
}
// encrypts and returns the cipher text
export async function encrypt({ plaintext, encryptionKey, iv, additionalData }: EncryptParams): Promise<string> {
  const encoder = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    {
      iv,
      ...AES_GCM_PARAMS,
      additionalData: encoder.encode(additionalData),
    },
    encryptionKey,
    encoder.encode(plaintext),
  )
  return new Uint8Array(ciphertext).toString()
}

interface DecryptParams {
  encryptionKey: CryptoKey
  ciphertext: Uint8Array
  iv: Uint8Array
  additionalData?: string
}

export async function decrypt({
  encryptionKey,
  ciphertext,
  iv,
  additionalData,
}: DecryptParams): Promise<string | undefined> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  try {
    // if this is successful, the password is correct. Otherwise it will throw an error
    const result = await crypto.subtle.decrypt(
      {
        iv,
        ...AES_GCM_PARAMS,
        additionalData: encoder.encode(additionalData),
      },
      encryptionKey,
      ciphertext,
    )
    return decoder.decode(result)
  } catch (_error) {
    logger.debug('crypto', 'decryptPassword', 'incorrect password')
    return undefined
  }
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const rawKey = await window.crypto.subtle.exportKey('raw', key)
  const keyArray = new Uint8Array(rawKey)
  const binaryString = String.fromCharCode.apply(null, [...keyArray])
  const keyBase64 = btoa(binaryString)
  return keyBase64
}

export async function convertBytesToCryptoKey(bytes: Uint8Array): Promise<CryptoKey> {
  return window.crypto.subtle.importKey('raw', bytes, AES_GCM_PARAMS, true, ['encrypt', 'decrypt'])
}

export async function convertBase64SeedToCryptoKey(keyBase64: string): Promise<CryptoKey> {
  const bytes = Uint8Array.from(window.atob(keyBase64), (c) => c.charCodeAt(0))
  return convertBytesToCryptoKey(bytes)
}

export async function getEncryptionKeyFromBuffer({
  buffer,
  secretPayload,
}: {
  buffer: BufferSource
  secretPayload: SecretPayload
}): Promise<CryptoKey> {
  const { name, iterations, hash } = secretPayload
  const salt = decodeFromStorage(secretPayload.salt)
  const pbkdf2Params = { salt, name, iterations, hash }
  const keyMaterial = await crypto.subtle.importKey('raw', buffer, PBKDF2_PARAMS.name, false, ['deriveKey'])

  // TODO: This should use Argon2 like ToB recommended for the mobile app
  // https://github.com/Uniswap/universe/blob/main/apps/mobile/ios/EncryptionHelper.swift
  return crypto.subtle.deriveKey(pbkdf2Params, keyMaterial, AES_GCM_PARAMS, true, ['encrypt', 'decrypt'])
}

export async function getEncryptionKeyFromPassword({
  password,
  secretPayload,
}: {
  password: string
  secretPayload: SecretPayload
}): Promise<CryptoKey> {
  return getEncryptionKeyFromBuffer({ buffer: new TextEncoder().encode(password), secretPayload })
}

export async function createEmptySecretPayload(): Promise<SecretPayload> {
  const salt = CryptoModule.generateNewSalt()
  const iv = CryptoModule.generateNewIV()

  const secretPayload: SecretPayload = {
    ...PBKDF2_PARAMS,
    iv: encodeForStorage(iv),
    salt: encodeForStorage(salt),
  }

  return secretPayload
}

export async function addEncryptedCiphertextToSecretPayload({
  secretPayload,
  plaintext,
  encryptionKey,
  additionalData,
}: {
  secretPayload: SecretPayload
  plaintext: string
  encryptionKey: CryptoKey
  additionalData: string
}): Promise<SecretPayload & { ciphertext: string }> {
  const ciphertext = await CryptoModule.encrypt({
    plaintext,
    encryptionKey,
    iv: decodeFromStorage(secretPayload.iv),
    additionalData,
  })

  return {
    ...secretPayload,
    ciphertext,
  }
}
