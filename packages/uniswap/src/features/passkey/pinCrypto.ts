import { gcm } from '@noble/ciphers/aes.js'
import { p256 } from '@noble/curves/nist.js'
import { argon2id } from '@noble/hashes/argon2.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { generateRandomBytes } from '@universe/cryptography'
import { base64ToUint8, uint8ToBase64 } from '@universe/encoding'

// OPRF types (lazy-loaded to code-split @cloudflare/voprf-ts)
type OprfClient = InstanceType<typeof import('@cloudflare/voprf-ts').OPRFClient>
type FinalizeData = import('@cloudflare/voprf-ts').FinalizeData

export interface OprfBlindState {
  finalizationData: FinalizeData
  client: OprfClient
}

export const ARGON2_PARAMS = { t: 3, m: 262144, p: 4 } as const // 256 MB, 3 iterations, 4 parallelism
export const HKDF_INFO = new TextEncoder().encode('uniswap-recovery-v1')
export const AES_KEY_LENGTH = 32
export const SALT_LENGTH = 16
const IV_LENGTH = 12

// --- OPRF ---

async function getOprfModule(): Promise<typeof import('@cloudflare/voprf-ts')> {
  // @vite-ignore: bare specifier resolved by bundler; Vite can't statically analyze this dynamic import
  return await import(/* @vite-ignore */ '@cloudflare/voprf-ts')
}

export async function blindPin(pin: string): Promise<{ blindedElement: string; blindState: OprfBlindState }> {
  const { Oprf, OPRFClient } = await getOprfModule()
  const client = new OPRFClient(Oprf.Suite.P256_SHA256)
  const input = new TextEncoder().encode(pin)
  const [finalizationData, evaluationRequest] = await client.blind([input])
  return {
    blindedElement: uint8ToBase64(evaluationRequest.serialize()),
    blindState: { finalizationData, client },
  }
}

export async function finalizeOprf(blindState: OprfBlindState, evaluationBase64: string): Promise<Uint8Array> {
  const { Oprf, Evaluation } = await getOprfModule()
  const evaluationBytes = base64ToUint8(evaluationBase64)
  const evaluation = Evaluation.deserialize(Oprf.Suite.P256_SHA256, evaluationBytes)
  const outputs = await blindState.client.finalize(blindState.finalizationData, evaluation)
  const output = outputs[0]
  if (!output) {
    throw new Error('OPRF finalization returned empty output')
  }
  return output
}

// --- Key Derivation ---

/** Combine OPRF output + Argon2 pinKey via HKDF. Zeros ikm before returning. */
export function combineAndDeriveKey(params: {
  oprfOutput: Uint8Array
  pinKey: Uint8Array
  salt2: Uint8Array
}): Uint8Array {
  const { oprfOutput, pinKey, salt2 } = params
  const ikm = new Uint8Array(oprfOutput.length + pinKey.length)
  ikm.set(oprfOutput, 0)
  ikm.set(pinKey, oprfOutput.length)
  const finalKey = hkdf(sha256, ikm, salt2, HKDF_INFO, AES_KEY_LENGTH)
  ikm.fill(0)
  return finalKey
}

export async function deriveEncryptionKey(params: {
  pin: string
  oprfOutput: Uint8Array
  salt1: Uint8Array
  salt2: Uint8Array
  /** Test-only override — production callers must use the ARGON2_PARAMS default */
  argon2Params?: { t: number; m: number; p: number }
}): Promise<Uint8Array> {
  const pinBytes = new TextEncoder().encode(params.pin)
  const pinKey = argon2id(pinBytes, params.salt1, params.argon2Params ?? ARGON2_PARAMS)
  const finalKey = combineAndDeriveKey({ oprfOutput: params.oprfOutput, pinKey, salt2: params.salt2 })
  pinKey.fill(0)
  return finalKey
}

// --- AES-256-GCM Encryption ---

export function encryptAuthKey(params: {
  finalKey: Uint8Array
  authPrivateKey: Uint8Array
  salt1: Uint8Array
  salt2: Uint8Array
}): string {
  const { finalKey, authPrivateKey, salt1, salt2 } = params
  const iv = generateRandomBytes(IV_LENGTH)
  const cipher = gcm(finalKey, iv)
  const ciphertextWithTag = cipher.encrypt(authPrivateKey)

  // blob = salt1[16] || salt2[16] || IV[12] || ciphertext+tag[48]
  const blob = new Uint8Array(SALT_LENGTH + SALT_LENGTH + IV_LENGTH + ciphertextWithTag.length)
  blob.set(salt1, 0)
  blob.set(salt2, SALT_LENGTH)
  blob.set(iv, SALT_LENGTH + SALT_LENGTH)
  blob.set(ciphertextWithTag, SALT_LENGTH + SALT_LENGTH + IV_LENGTH)

  return uint8ToBase64(blob)
}

export function parseBlob(blob: string): {
  salt1: Uint8Array
  salt2: Uint8Array
  iv: Uint8Array
  ciphertextWithTag: Uint8Array
} {
  const bytes = base64ToUint8(blob)
  const salt1 = bytes.slice(0, SALT_LENGTH)
  const salt2 = bytes.slice(SALT_LENGTH, SALT_LENGTH * 2)
  const iv = bytes.slice(SALT_LENGTH * 2, SALT_LENGTH * 2 + IV_LENGTH)
  const ciphertextWithTag = bytes.slice(SALT_LENGTH * 2 + IV_LENGTH)
  return { salt1, salt2, iv, ciphertextWithTag }
}

export function decryptAuthKey(params: {
  finalKey: Uint8Array
  iv: Uint8Array
  ciphertextWithTag: Uint8Array
}): Uint8Array {
  const { finalKey, iv, ciphertextWithTag } = params
  const cipher = gcm(finalKey, iv)
  return cipher.decrypt(ciphertextWithTag) // throws on GCM tag mismatch
}

// --- P-256 Key Operations ---

export async function generateAuthKeyPair(): Promise<{ publicKey: string; privateKey: Uint8Array }> {
  const privateKey = p256.utils.randomSecretKey()
  const uncompressed = p256.getPublicKey(privateKey, false) // uncompressed (65 bytes: 0x04 || x || y)

  // Wrap in SPKI DER via Web Crypto — Privy requires this format
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    uncompressed as BufferSource,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify'],
  )
  const spkiDer = await crypto.subtle.exportKey('spki', cryptoKey)
  const publicKey = uint8ToBase64(new Uint8Array(spkiDer))

  return { publicKey, privateKey }
}

export function signWithAuthKey(privateKey: Uint8Array, data: Uint8Array): string {
  const msgHash = sha256(data)
  const signature = p256.sign(msgHash, privateKey, { prehash: false, format: 'der' })
  return uint8ToBase64(signature)
}

// --- Auth Method ID ---

export function hashAuthMethodId(identifier: string): string {
  const bytes = new TextEncoder().encode(identifier.toLowerCase())
  return bytesToHex(sha256(bytes))
}

// --- Buffer Zeroing ---

/** Zero one or more Uint8Arrays. Safely skips undefined values. */
export function zeroBuffers(...buffers: (Uint8Array | undefined)[]): void {
  for (const buf of buffers) {
    buf?.fill(0)
  }
}
