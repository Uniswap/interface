import { logger } from 'utilities/src/logger/logger'

const PBKDF2_PARAMS: Omit<Pbkdf2Params, 'salt'> & { hash: string } = {
  name: 'PBKDF2',
  iterations: 100000,
  hash: 'SHA-256',
}

const AES_GCM_PARAMS: AesKeyGenParams = { name: 'AES-GCM', length: 256 }

// TODO: improve encoding/decoding
const encodeForStorage = (payload: ArrayBuffer): string => payload.toString()
const decodeFromStorage = (payload: string): Uint8Array =>
  new Uint8Array(payload.split(',').map((x) => Number(x)))

// An encrypted secret with associated metadata required for decryption
export type SecretPayload = {
  ciphertext: string
  iv: string
  salt: string
  name: string
  iterations: number
  hash: string
}

export async function encrypt(
  plaintext: string,
  password: string,
  address: string // address of a private key or address of 0 index for a mnemonic
): Promise<SecretPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()

  const pbkdf2Params = { salt, ...PBKDF2_PARAMS }

  const encodedPlaintext = encoder.encode(plaintext)
  const keyMaterial = await getKeyMaterial(password)
  const key = await getKey(keyMaterial, pbkdf2Params, AES_GCM_PARAMS)

  const ciphertext = await crypto.subtle.encrypt(
    {
      iv,
      ...AES_GCM_PARAMS,
      additionalData: encoder.encode(address),
    },
    key,
    encodedPlaintext
  )

  const secretPayload: SecretPayload = {
    ...pbkdf2Params,
    ciphertext: new Uint8Array(ciphertext).toString(),
    iv: encodeForStorage(iv),
    salt: encodeForStorage(salt),
  }

  return secretPayload
}

export async function decrypt(
  passwordAttempt: string,
  secretPayload: SecretPayload,
  expectedAddress: string
): Promise<string | undefined> {
  const { name, iterations, hash } = secretPayload

  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const additionalData = encoder.encode(expectedAddress)

  const ciphertext = decodeFromStorage(secretPayload.ciphertext)
  const iv = decodeFromStorage(secretPayload.iv)
  const salt = decodeFromStorage(secretPayload.salt)

  const pbkdf2Params = { salt, name, iterations, hash }

  const keyMaterial = await getKeyMaterial(passwordAttempt)
  const key = await getKey(keyMaterial, pbkdf2Params, AES_GCM_PARAMS)

  try {
    // if this is successful, the password is correct. Otherwise it will throw an error
    const result = await crypto.subtle.decrypt(
      {
        iv,
        ...AES_GCM_PARAMS,
        additionalData,
      },
      key,
      ciphertext
    )
    return decoder.decode(result)
  } catch (error) {
    logger.debug('crypto', 'decryptPassword', 'incorrect password')
    return undefined
  }
}

function getKeyMaterial(password: string, algorithm = PBKDF2_PARAMS.name): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(password), algorithm, false, [
    'deriveBits',
    'deriveKey',
  ])
}

function getKey(
  keyMaterial: CryptoKey,
  algorithmParams: Pbkdf2Params,
  derivedKeyAlgorithm: AesKeyGenParams,
  extractable = true,
  keyUsages: KeyUsage[] = ['encrypt', 'decrypt']
): Promise<CryptoKey> {
  // TODO: This should use Argon2 like ToB recommended for the mobile app
  // https://github.com/Uniswap/universe/blob/main/apps/mobile/ios/EncryptionHelper.swift
  return crypto.subtle.deriveKey(
    algorithmParams,
    keyMaterial,
    derivedKeyAlgorithm,
    extractable,
    keyUsages
  )
}
