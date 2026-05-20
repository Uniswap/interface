import { describe, expect, it } from 'vitest'
import { generateRandomBytes } from './random'

describe('generateRandomBytes', () => {
  it('returns a Uint8Array of the requested length', () => {
    const bytes = generateRandomBytes(16)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBe(16)
  })

  it('returns an empty array for length 0', () => {
    expect(generateRandomBytes(0)).toEqual(new Uint8Array())
  })

  it('produces different output across calls', () => {
    const a = generateRandomBytes(32)
    const b = generateRandomBytes(32)
    expect(a).not.toEqual(b)
  })

  it('honors common cryptographic sizes', () => {
    expect(generateRandomBytes(12).length).toBe(12) // AES-GCM IV
    expect(generateRandomBytes(16).length).toBe(16) // PBKDF2 salt
    expect(generateRandomBytes(32).length).toBe(32) // 256-bit key
  })
})
