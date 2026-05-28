import {
  blindPin,
  decryptAuthKey,
  deriveEncryptionKey,
  encryptAuthKey,
  generateAuthKeyPair,
  hashAuthMethodId,
  parseBlob,
  signWithAuthKey,
} from 'uniswap/src/features/passkey/pinCrypto'
import { describe, expect, it } from 'vitest'

describe('pinCrypto', () => {
  describe('generateAuthKeyPair', () => {
    it('generates a P-256 key pair with SPKI DER base64 public key', async () => {
      const { publicKey, privateKey } = await generateAuthKeyPair()
      expect(privateKey).toBeInstanceOf(Uint8Array)
      expect(privateKey.length).toBe(32)
      expect(typeof publicKey).toBe('string')
      // SPKI DER for P-256 is 91 bytes → ~124 base64 chars
      expect(publicKey.length).toBeGreaterThan(80)
    })

    it('generates unique key pairs', async () => {
      const kp1 = await generateAuthKeyPair()
      const kp2 = await generateAuthKeyPair()
      expect(kp1.privateKey).not.toEqual(kp2.privateKey)
    })
  })

  describe('hashAuthMethodId', () => {
    it('produces hex-encoded SHA-256 of lowercased input', () => {
      const hash = hashAuthMethodId('User@Example.com')
      const hashLower = hashAuthMethodId('user@example.com')
      expect(hash).toBe(hashLower) // case-insensitive
      expect(hash).toMatch(/^[0-9a-f]{64}$/) // 64 hex chars = 32 bytes
    })
  })

  describe('signWithAuthKey', () => {
    it('produces a base64-encoded DER signature from raw bytes', async () => {
      const { privateKey } = await generateAuthKeyPair()
      const data = new TextEncoder().encode('test signing payload')
      const sig = signWithAuthKey(privateKey, data)
      expect(typeof sig).toBe('string')
      expect(sig.length).toBeGreaterThan(0)
      expect(sig).toMatch(/^[A-Za-z0-9+/]+=*$/)
    })
  })

  describe('blob round-trip', () => {
    it('encrypts and decrypts auth key via blob', { timeout: 60_000 }, async () => {
      const { privateKey } = await generateAuthKeyPair()
      const salt1 = crypto.getRandomValues(new Uint8Array(16))
      const salt2 = crypto.getRandomValues(new Uint8Array(16))

      // Use a deterministic key for testing (skip OPRF/Argon2)
      const fakeOprfOutput = crypto.getRandomValues(new Uint8Array(32))
      const finalKey = await deriveEncryptionKey({
        pin: '5678',
        oprfOutput: fakeOprfOutput,
        salt1,
        salt2,
      })

      const blob = encryptAuthKey({ finalKey, authPrivateKey: privateKey, salt1, salt2 })
      expect(typeof blob).toBe('string') // base64

      const parsed = parseBlob(blob)
      expect(parsed.salt1).toEqual(salt1)
      expect(parsed.salt2).toEqual(salt2)
      expect(parsed.iv.length).toBe(12)

      const decrypted = decryptAuthKey({ finalKey, iv: parsed.iv, ciphertextWithTag: parsed.ciphertextWithTag })
      expect(decrypted).toEqual(privateKey)
    })

    it('fails decryption with wrong key', { timeout: 120_000 }, async () => {
      const { privateKey } = await generateAuthKeyPair()
      const salt1 = crypto.getRandomValues(new Uint8Array(16))
      const salt2 = crypto.getRandomValues(new Uint8Array(16))
      const fakeOprfOutput = crypto.getRandomValues(new Uint8Array(32))

      const correctKey = await deriveEncryptionKey({
        pin: '5678',
        oprfOutput: fakeOprfOutput,
        salt1,
        salt2,
      })
      const blob = encryptAuthKey({ finalKey: correctKey, authPrivateKey: privateKey, salt1, salt2 })

      // Derive a different key (wrong PIN simulation)
      const wrongKey = await deriveEncryptionKey({
        pin: '9999',
        oprfOutput: fakeOprfOutput,
        salt1,
        salt2,
      })

      const parsed = parseBlob(blob)
      expect(() =>
        decryptAuthKey({ finalKey: wrongKey, iv: parsed.iv, ciphertextWithTag: parsed.ciphertextWithTag }),
      ).toThrow()
    })
  })

  describe('deriveEncryptionKey', () => {
    it('is deterministic for same inputs', { timeout: 120_000 }, async () => {
      const oprfOutput = crypto.getRandomValues(new Uint8Array(32))
      const salt1 = crypto.getRandomValues(new Uint8Array(16))
      const salt2 = crypto.getRandomValues(new Uint8Array(16))

      const key1 = await deriveEncryptionKey({ pin: '1234', oprfOutput, salt1, salt2 })
      const key2 = await deriveEncryptionKey({ pin: '1234', oprfOutput, salt1, salt2 })
      expect(key1).toEqual(key2)
    })

    it('produces different keys for different PINs', { timeout: 120_000 }, async () => {
      const oprfOutput = crypto.getRandomValues(new Uint8Array(32))
      const salt1 = crypto.getRandomValues(new Uint8Array(16))
      const salt2 = crypto.getRandomValues(new Uint8Array(16))

      const key1 = await deriveEncryptionKey({ pin: '1234', oprfOutput, salt1, salt2 })
      const key2 = await deriveEncryptionKey({ pin: '5678', oprfOutput, salt1, salt2 })
      expect(key1).not.toEqual(key2)
    })

    it('returns a 32-byte key', { timeout: 60_000 }, async () => {
      const key = await deriveEncryptionKey({
        pin: '4567',
        oprfOutput: crypto.getRandomValues(new Uint8Array(32)),
        salt1: crypto.getRandomValues(new Uint8Array(16)),
        salt2: crypto.getRandomValues(new Uint8Array(16)),
      })
      expect(key.length).toBe(32) // AES-256
    })
  })

  describe('OPRF blind/finalize', () => {
    it('blindPin returns base64 blinded element and blind state', async () => {
      const { blindedElement, blindState } = await blindPin('5678')
      expect(typeof blindedElement).toBe('string')
      expect(blindedElement.length).toBeGreaterThan(0)
      expect(blindState).toBeDefined()
    })
  })
})
