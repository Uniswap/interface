import {
  canonicalizeJSON,
  clearDeviceSession,
  clearNeckMetadata,
  deleteNeckSigningKey,
  ensureNeckKeyPair,
  generateDeviceKeyPair,
  getDeviceSession,
  hasActiveNeckKey,
  loadNeckMetadata,
  loadNeckSigningKey,
  setDeviceSession,
  signWithDeviceKey,
  storeNeckMetadata,
  storeNeckSigningKey,
} from 'uniswap/src/features/passkey/deviceSession'
import { vi } from 'vitest'

describe('deviceSession', () => {
  afterEach(() => {
    clearDeviceSession()
  })

  describe('getDeviceSession', () => {
    it('returns null when no session is set', () => {
      expect(getDeviceSession()).toBeNull()
    })

    it('returns null when session has expired', async () => {
      const { privateKey } = await generateDeviceKeyPair()
      setDeviceSession({
        privateKey,
        policyId: 'policy-1',
        policyExpiresAt: Date.now() - 1000, // expired 1 second ago
        walletId: 'wallet-1',
      })
      expect(getDeviceSession()).toBeNull()
    })

    it('returns session within expiry window', async () => {
      const { privateKey } = await generateDeviceKeyPair()
      const session = {
        privateKey,
        policyId: 'policy-1',
        policyExpiresAt: Date.now() + 60_000, // expires in 1 minute
        walletId: 'wallet-1',
      }
      setDeviceSession(session)
      expect(getDeviceSession()).toEqual(session)
    })
  })

  describe('setDeviceSession / clearDeviceSession lifecycle', () => {
    it('sets and clears a session', async () => {
      const { privateKey } = await generateDeviceKeyPair()
      setDeviceSession({
        privateKey,
        policyId: 'policy-1',
        policyExpiresAt: Date.now() + 60_000,
        walletId: 'wallet-1',
      })
      expect(getDeviceSession()).not.toBeNull()

      clearDeviceSession()
      expect(getDeviceSession()).toBeNull()
    })
  })

  describe('generateDeviceKeyPair', () => {
    it('produces a valid P-256 key pair', async () => {
      const { privateKey, publicKeyBase64 } = await generateDeviceKeyPair()

      // Private key is a CryptoKey
      expect(privateKey).toBeInstanceOf(CryptoKey)
      expect(privateKey.type).toBe('private')
      expect(privateKey.algorithm).toMatchObject({ name: 'ECDSA', namedCurve: 'P-256' })
      expect(privateKey.extractable).toBe(false)
      expect(privateKey.usages).toContain('sign')

      // Public key is standard base64 (SPKI DER)
      expect(publicKeyBase64).toBeTruthy()
      // Should be decodable as base64
      expect(() => atob(publicKeyBase64)).not.toThrow()
    })

    it('generates unique key pairs on each call', async () => {
      const pair1 = await generateDeviceKeyPair()
      const pair2 = await generateDeviceKeyPair()
      expect(pair1.publicKeyBase64).not.toBe(pair2.publicKeyBase64)
    })
  })

  describe('signWithDeviceKey', () => {
    it('produces a valid ECDSA signature that can be verified', async () => {
      const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify'])

      const payload = 'hello world'
      const payloadBase64url = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '')

      const signatureBase64 = await signWithDeviceKey(keyPair.privateKey, payloadBase64url)

      // Signature should be non-empty standard base64
      expect(signatureBase64).toBeTruthy()
      expect(() => atob(signatureBase64)).not.toThrow()

      // Verify the signature with the public key
      const sigBytes = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0))
      const payloadBytes = new TextEncoder().encode(payload)
      const isValid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: { name: 'SHA-256' } },
        keyPair.publicKey,
        sigBytes,
        payloadBytes,
      )
      expect(isValid).toBe(true)
    })

    it('handles base64url padding correctly', async () => {
      const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify'])

      // Create payloads of varying lengths to test different padding scenarios
      for (const payload of ['a', 'ab', 'abc', 'abcd']) {
        const b64 = btoa(payload)
        const b64url = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '')
        const sig = await signWithDeviceKey(keyPair.privateKey, b64url)
        expect(sig).toBeTruthy()
      }
    })
  })

  describe('canonicalizeJSON', () => {
    it('sorts keys alphabetically', () => {
      expect(canonicalizeJSON({ b: 1, a: 2 })).toBe('{"a":2,"b":1}')
    })

    it('handles nested objects', () => {
      expect(canonicalizeJSON({ z: { b: 1, a: 2 }, a: 3 })).toBe('{"a":3,"z":{"a":2,"b":1}}')
    })

    it('handles arrays (preserves order)', () => {
      expect(canonicalizeJSON([3, 1, 2])).toBe('[3,1,2]')
    })

    it('handles null', () => {
      expect(canonicalizeJSON(null)).toBe('null')
    })

    it('handles primitives', () => {
      expect(canonicalizeJSON(42)).toBe('42')
      expect(canonicalizeJSON('hello')).toBe('"hello"')
      expect(canonicalizeJSON(true)).toBe('true')
    })

    it('handles mixed nested structures', () => {
      const input = {
        method: 'PATCH',
        body: { public_keys: ['key1', 'key2'] },
        headers: { 'privy-app-id': 'abc123' },
        url: 'https://api.privy.io/v1/key_quorums/123',
        version: 1,
      }
      const result = canonicalizeJSON(input)
      // Keys at each level should be sorted
      expect(result).toBe(
        '{"body":{"public_keys":["key1","key2"]},"headers":{"privy-app-id":"abc123"},"method":"PATCH","url":"https://api.privy.io/v1/key_quorums/123","version":1}',
      )
    })

    it('handles empty objects and arrays', () => {
      expect(canonicalizeJSON({})).toBe('{}')
      expect(canonicalizeJSON([])).toBe('[]')
    })
  })

  describe('NECK metadata (localStorage)', () => {
    afterEach(() => {
      clearNeckMetadata()
    })

    it('returns null when no metadata stored', () => {
      expect(loadNeckMetadata()).toBeNull()
    })

    it('stores and loads metadata', () => {
      const metadata = { publicKeyBase64: 'abc123', walletId: 'wallet-1', deviceKeyQuorumId: 'quorum-1' }
      storeNeckMetadata(metadata)
      expect(loadNeckMetadata()).toEqual(metadata)
    })

    it('clears metadata', () => {
      storeNeckMetadata({ publicKeyBase64: 'abc', walletId: 'w', deviceKeyQuorumId: '' })
      clearNeckMetadata()
      expect(loadNeckMetadata()).toBeNull()
    })

    it('returns null for corrupted localStorage data', () => {
      localStorage.setItem('embedded-wallet-neck-meta', 'not-json')
      expect(loadNeckMetadata()).toBeNull()
    })

    it('returns null when parsed shape is missing publicKeyBase64', () => {
      localStorage.setItem('embedded-wallet-neck-meta', JSON.stringify({ walletId: 'w1', deviceKeyQuorumId: 'q1' }))
      expect(loadNeckMetadata()).toBeNull()
    })

    it('returns null when parsed shape is missing walletId', () => {
      localStorage.setItem(
        'embedded-wallet-neck-meta',
        JSON.stringify({ publicKeyBase64: 'k1', deviceKeyQuorumId: 'q1' }),
      )
      expect(loadNeckMetadata()).toBeNull()
    })

    it('defaults deviceKeyQuorumId to empty string when absent', () => {
      localStorage.setItem('embedded-wallet-neck-meta', JSON.stringify({ publicKeyBase64: 'k1', walletId: 'w1' }))
      expect(loadNeckMetadata()).toEqual({ publicKeyBase64: 'k1', walletId: 'w1', deviceKeyQuorumId: '' })
    })

    it('overwrites previous metadata', () => {
      storeNeckMetadata({ publicKeyBase64: 'key1', walletId: 'w1', deviceKeyQuorumId: '' })
      storeNeckMetadata({ publicKeyBase64: 'key2', walletId: 'w2', deviceKeyQuorumId: 'q2' })
      expect(loadNeckMetadata()).toEqual({ publicKeyBase64: 'key2', walletId: 'w2', deviceKeyQuorumId: 'q2' })
    })
  })

  describe('NECK signing key (in-memory)', () => {
    afterEach(async () => {
      // Clean up any keys set during tests so state doesn't leak across cases
      deleteNeckSigningKey('mem-wallet-1')
      deleteNeckSigningKey('mem-wallet-2')
    })

    it('returns null when no key is stored for the walletId', async () => {
      expect(loadNeckSigningKey('mem-wallet-1')).toBeNull()
      expect(hasActiveNeckKey('mem-wallet-1')).toBe(false)
    })

    it('stores and loads a CryptoKey handle in memory', async () => {
      const { privateKey } = await generateDeviceKeyPair()
      storeNeckSigningKey('mem-wallet-1', privateKey)

      expect(hasActiveNeckKey('mem-wallet-1')).toBe(true)
      expect(loadNeckSigningKey('mem-wallet-1')).toBe(privateKey)
    })

    it('keeps keys isolated per walletId', async () => {
      const { privateKey: key1 } = await generateDeviceKeyPair()
      const { privateKey: key2 } = await generateDeviceKeyPair()
      storeNeckSigningKey('mem-wallet-1', key1)
      storeNeckSigningKey('mem-wallet-2', key2)

      expect(loadNeckSigningKey('mem-wallet-1')).toBe(key1)
      expect(loadNeckSigningKey('mem-wallet-2')).toBe(key2)
    })

    it('removes a key with deleteNeckSigningKey', async () => {
      const { privateKey } = await generateDeviceKeyPair()
      storeNeckSigningKey('mem-wallet-1', privateKey)
      expect(hasActiveNeckKey('mem-wallet-1')).toBe(true)

      deleteNeckSigningKey('mem-wallet-1')
      expect(hasActiveNeckKey('mem-wallet-1')).toBe(false)
      expect(loadNeckSigningKey('mem-wallet-1')).toBeNull()
    })

    it('does not persist across module reload (simulates window close)', async () => {
      const { privateKey } = await generateDeviceKeyPair()
      storeNeckSigningKey('mem-wallet-1', privateKey)
      expect(loadNeckSigningKey('mem-wallet-1')).toBe(privateKey)

      // Simulate window close: module state is reset when vi re-imports.
      vi.resetModules()
      const fresh = await import('uniswap/src/features/passkey/deviceSession')
      expect(fresh.loadNeckSigningKey('mem-wallet-1')).toBeNull()
      expect(fresh.hasActiveNeckKey('mem-wallet-1')).toBe(false)
    })
  })

  describe('ensureNeckKeyPair', () => {
    afterEach(async () => {
      clearNeckMetadata()
      deleteNeckSigningKey('ensure-wallet-1')
    })

    it('reuses existing pair when metadata and in-memory key are both present (isFresh: false)', async () => {
      const { privateKey, publicKeyBase64 } = await generateDeviceKeyPair()
      storeNeckSigningKey('ensure-wallet-1', privateKey)
      storeNeckMetadata({ publicKeyBase64, walletId: 'ensure-wallet-1', deviceKeyQuorumId: 'q1' })

      const result = await ensureNeckKeyPair('ensure-wallet-1')

      expect(result.privateKey).toBe(privateKey)
      expect(result.publicKeyBase64).toBe(publicKeyBase64)
      expect(result.isFresh).toBe(false)
      // deviceKeyQuorumId preserved from prior metadata
      expect(loadNeckMetadata()?.deviceKeyQuorumId).toBe('q1')
    })

    it('regenerates when metadata exists but in-memory key is missing — returns isFresh: true', async () => {
      const { publicKeyBase64: oldPub } = await generateDeviceKeyPair()
      storeNeckMetadata({ publicKeyBase64: oldPub, walletId: 'ensure-wallet-1', deviceKeyQuorumId: 'q1' })
      // No key stored in the in-memory Map — simulates post window-close state

      const result = await ensureNeckKeyPair('ensure-wallet-1')

      expect(result.publicKeyBase64).not.toBe(oldPub)
      expect(result.isFresh).toBe(true)
      expect(hasActiveNeckKey('ensure-wallet-1')).toBe(true)
      // Metadata overwritten with the fresh pub key, quorumId preserved
      const meta = loadNeckMetadata()
      expect(meta?.publicKeyBase64).toBe(result.publicKeyBase64)
      expect(meta?.deviceKeyQuorumId).toBe('q1')
    })

    it('regenerates when metadata is missing entirely — returns isFresh: true', async () => {
      expect(loadNeckMetadata()).toBeNull()

      const result = await ensureNeckKeyPair('ensure-wallet-1')

      expect(result.privateKey).toBeInstanceOf(CryptoKey)
      expect(result.publicKeyBase64).toBeTruthy()
      expect(result.isFresh).toBe(true)
      expect(loadNeckMetadata()).toEqual({
        publicKeyBase64: result.publicKeyBase64,
        walletId: 'ensure-wallet-1',
        deviceKeyQuorumId: '',
      })
    })

    it('regenerates when metadata walletId does not match — returns isFresh: true', async () => {
      const { privateKey, publicKeyBase64 } = await generateDeviceKeyPair()
      storeNeckSigningKey('other-wallet', privateKey)
      storeNeckMetadata({ publicKeyBase64, walletId: 'other-wallet', deviceKeyQuorumId: 'q1' })

      const result = await ensureNeckKeyPair('ensure-wallet-1')

      expect(result.publicKeyBase64).not.toBe(publicKeyBase64)
      expect(result.isFresh).toBe(true)
      expect(loadNeckMetadata()?.walletId).toBe('ensure-wallet-1')
    })
  })
})
