import { base64ToUint8, base64urlToBase64, uint8ToBase64 } from '@universe/encoding'

interface DeviceSession {
  privateKey: CryptoKey // non-extractable, never leaves browser
  policyExpiresAt: number // Unix ms; session lasts 1 minute
  policyId: string
  walletId?: string
  deviceKeyQuorumId?: string // returned by CreateWallet
}

let _deviceSession: DeviceSession | null = null

export function getDeviceSession(): DeviceSession | null {
  if (!_deviceSession) {
    return null
  }
  if (Date.now() >= _deviceSession.policyExpiresAt) {
    _deviceSession = null
    return null
  }
  return _deviceSession
}

export function setDeviceSession(session: DeviceSession): void {
  _deviceSession = session
}

export function clearDeviceSession(): void {
  _deviceSession = null
}

// ---------------------------------------------------------------------------
// NECK signing key — in-memory only (not persisted).
//
// The CryptoKey handle lives in a module-level Map keyed by walletId. The key
// itself is non-extractable (JS cannot read the private bytes — it can only
// call crypto.subtle.sign()), but we also keep the handle out of IndexedDB:
// IDB persists to the filesystem, which a native app with filesystem access
// could read. In-memory-only means window close = new session (user
// re-authenticates with passkey) — the accepted UX tradeoff for the stronger
// threat model.
// ---------------------------------------------------------------------------

const neckSigningKeys = new Map<string, CryptoKey>()

export function storeNeckSigningKey(walletId: string, key: CryptoKey): void {
  neckSigningKeys.set(walletId, key)
}

export function loadNeckSigningKey(walletId: string): CryptoKey | null {
  return neckSigningKeys.get(walletId) ?? null
}

export function deleteNeckSigningKey(walletId: string): void {
  neckSigningKeys.delete(walletId)
}

export function hasActiveNeckKey(walletId: string): boolean {
  return neckSigningKeys.has(walletId)
}

/**
 * Returns a live NECK key pair for walletId. Uses the existing pair when both
 * metadata (localStorage) and the in-memory private key are present; otherwise
 * generates a fresh pair and persists it, with `isFresh: true`.
 *
 * Why both checks: metadata survives a window close but the CryptoKey (in-memory
 * only) doesn't. Trusting metadata alone leads to the caller completing a
 * Challenge with the stale public key, then failing to sign because the
 * corresponding private key is gone.
 *
 * Why `isFresh`: the server's Challenge(sessionActive) check doesn't verify
 * that the client-supplied public key matches the one registered for the
 * wallet — it only checks "is there *any* active session?". After regenerating,
 * the server will happily return sessionActive=true but then reject the
 * subsequent deviceAuth signature because it validates against the stale
 * registered pub key. Callers must call `refreshNeckSession` when `isFresh`
 * to register the new pub key server-side before signing.
 */
export async function ensureNeckKeyPair(walletId: string): Promise<{
  privateKey: CryptoKey
  publicKeyBase64: string
  isFresh: boolean
}> {
  const meta = loadNeckMetadata()
  if (meta && meta.walletId === walletId) {
    const existingKey = loadNeckSigningKey(walletId)
    if (existingKey) {
      return { privateKey: existingKey, publicKeyBase64: meta.publicKeyBase64, isFresh: false }
    }
  }
  const { privateKey, publicKeyBase64 } = await generateDeviceKeyPair()
  storeNeckSigningKey(walletId, privateKey)
  storeNeckMetadata({
    publicKeyBase64,
    walletId,
    deviceKeyQuorumId: meta?.deviceKeyQuorumId ?? '',
  })
  return { privateKey, publicKeyBase64, isFresh: true }
}

// NECK metadata — stored in localStorage (JSON-serializable, small, non-sensitive).
// Web-only: NECK is the browser-session device-key concept and is never
// engaged on mobile or extension (see call-site guards in `embeddedWallet.ts`).

export interface NeckMetadata {
  publicKeyBase64: string
  walletId: string
  deviceKeyQuorumId: string
}

const NECK_METADATA_KEY = 'embedded-wallet-neck-meta'

export function storeNeckMetadata(metadata: NeckMetadata): void {
  localStorage.setItem(NECK_METADATA_KEY, JSON.stringify(metadata))
}

export function loadNeckMetadata(): NeckMetadata | null {
  const raw = localStorage.getItem(NECK_METADATA_KEY)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as Partial<NeckMetadata>
    // Guard against partial writes / corrupt storage — both required fields must be present
    if (!parsed.publicKeyBase64 || !parsed.walletId) {
      return null
    }
    return {
      publicKeyBase64: parsed.publicKeyBase64,
      walletId: parsed.walletId,
      deviceKeyQuorumId: parsed.deviceKeyQuorumId ?? '',
    }
  } catch {
    return null
  }
}

export function clearNeckMetadata(): void {
  localStorage.removeItem(NECK_METADATA_KEY)
}

export async function generateDeviceKeyPair(): Promise<{
  privateKey: CryptoKey
  publicKeyBase64: string // SPKI DER, standard base64 (not base64url)
}> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, // extractable: false
    ['sign', 'verify'],
  )
  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const publicKeyBase64 = uint8ToBase64(new Uint8Array(spki))
  return { privateKey: keyPair.privateKey, publicKeyBase64 }
}

export async function signWithDeviceKey(privateKey: CryptoKey, signingPayloadBase64url: string): Promise<string> {
  const payloadBytes = base64ToUint8(base64urlToBase64(signingPayloadBase64url))
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    privateKey,
    payloadBytes,
  )
  // return as standard base64
  return uint8ToBase64(new Uint8Array(signatureBuffer))
}

// Simplified JSON canonicalization (sorted keys, no whitespace)
// Used to construct the Privy PATCH key quorum payload for AddAuthenticator
export function canonicalizeJSON(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj)
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJSON).join(',') + ']'
  }
  const sorted = Object.keys(obj as Record<string, unknown>).sort()
  return (
    '{' +
    sorted.map((k) => JSON.stringify(k) + ':' + canonicalizeJSON((obj as Record<string, unknown>)[k])).join(',') +
    '}'
  )
}
