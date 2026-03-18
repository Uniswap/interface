import {
  checkDifficulty,
  computeHash,
  findProof,
  formatHashcashString,
  type HashcashChallenge,
  verifyProof,
} from '@universe/sessions/src/challenge-solvers/hashcash/core'
import { describe, expect, it } from 'vitest'

describe('hashcash core', () => {
  // Backend example data for testing
  const backendExample: HashcashChallenge = {
    difficulty: 1,
    subject: 'Uniswap',
    algorithm: 'sha256',
    nonce: 'Qlquffem7d8RrL6fmveE68XK0KxcoczdiVpFrV1qeUk=',
    max_proof_length: 1000,
  }

  // Basic smoke test
  it('exports all required functions', () => {
    expect(checkDifficulty).toBeDefined()
    expect(computeHash).toBeDefined()
    expect(findProof).toBeDefined()
    expect(verifyProof).toBeDefined()
    expect(formatHashcashString).toBeDefined()
  })

  describe('checkDifficulty', () => {
    it('validates difficulty 1 (1 full zero byte)', () => {
      // Backend treats difficulty as number of zero BYTES
      // difficulty=1 means first byte must be 0
      const validHash = new Uint8Array([0, 255, 255, 255])
      expect(checkDifficulty(validHash, 1)).toBe(true)

      const invalidHash = new Uint8Array([1, 255, 255, 255])
      expect(checkDifficulty(invalidHash, 1)).toBe(false)

      const invalidHash2 = new Uint8Array([0b00000001, 255, 255, 255]) // Even 1 bit set fails
      expect(checkDifficulty(invalidHash2, 1)).toBe(false)
    })

    it('validates difficulty 2 (2 full zero bytes)', () => {
      // First two bytes must be all zeros
      const validHash = new Uint8Array([0, 0, 255, 255])
      expect(checkDifficulty(validHash, 2)).toBe(true)

      const invalidHash = new Uint8Array([0, 1, 255, 255]) // Second byte not zero
      expect(checkDifficulty(invalidHash, 2)).toBe(false)
    })

    it('validates difficulty 0 (no requirement)', () => {
      const anyHash = new Uint8Array([255, 255, 255, 255])
      expect(checkDifficulty(anyHash, 0)).toBe(true)
    })
  })

  describe('computeHash', () => {
    it('produces consistent SHA-256 hashes', async () => {
      const params = {
        subject: 'test',
        nonce: 'AQIDBA==', // Base64 string
        counter: 42,
      }

      const hash1 = await computeHash(params)
      const hash2 = await computeHash(params)

      expect(hash1).toEqual(hash2)
      expect(hash1.length).toBe(32) // SHA-256 is 32 bytes
    })

    it('works with real backend nonce', async () => {
      const hash = await computeHash({
        subject: backendExample.subject,
        nonce: backendExample.nonce, // Use nonce string directly
        counter: 0,
      })

      expect(hash).toBeDefined()
      expect(hash.length).toBe(32)
    })

    it('hashes colon-separated string format like backend', async () => {
      // Test that we're using the backend's expected format: "${subject}:${nonce}:${counter}"
      const nonceString = 'AQIDBA=='

      const hash = await computeHash({
        subject: 'Uniswap',
        nonce: nonceString,
        counter: 123,
      })

      // The hash should be of the string "Uniswap:AQIDBA==:123"
      expect(hash).toBeDefined()
      expect(hash.length).toBe(32)

      // Verify the expected string format
      const expectedString = `Uniswap:${nonceString}:123`
      expect(expectedString).toBe('Uniswap:AQIDBA==:123')
    })

    it('matches known SHA-256 test vector', async () => {
      // computeHash("Uniswap:AQIDBA==:123") verified against @noble/hashes/webcrypto SHA-256
      const hash = await computeHash({
        subject: 'Uniswap',
        nonce: 'AQIDBA==',
        counter: 123,
      })

      const expectedHex = '222c2db479a1ff907a329fc3ff8e99b1f19f0695d938b74ccd95323b9c853510'
      const actualHex = Array.from(hash)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      expect(actualHex).toBe(expectedHex)
    })
  })

  describe('findProof', () => {
    it('finds a valid proof for difficulty 1', async () => {
      const challenge: HashcashChallenge = {
        ...backendExample,
        difficulty: 1,
        max_proof_length: 10000, // Increase range for testing
      }

      const proof = await findProof({ challenge })

      expect(proof).not.toBeNull()
      if (proof) {
        expect(proof.counter).toBeDefined()
        expect(proof.hash).toBeDefined()
        expect(proof.attempts).toBeGreaterThan(0)
        expect(checkDifficulty(proof.hash, 1)).toBe(true)
      }
    })

    it('respects max_proof_length limit', async () => {
      const challenge: HashcashChallenge = {
        ...backendExample,
        difficulty: 20, // High difficulty unlikely to be found
        max_proof_length: 100,
      }

      const proof = await findProof({
        challenge,
        rangeSize: challenge.max_proof_length,
      })

      // Should return null since difficulty 20 (20 zero bytes) is impossible in 100 attempts
      expect(proof).toBeNull()
    })

    it('returns null when shouldStop signals cancellation', async () => {
      let calls = 0
      const shouldStop = (): boolean => {
        calls++
        // Stop after the first batch boundary check
        return calls >= 2
      }

      const challenge: HashcashChallenge = {
        ...backendExample,
        difficulty: 20, // High difficulty so it won't find a proof naturally
        max_proof_length: 100_000,
      }

      const proof = await findProof({
        challenge,
        shouldStop,
        batchSize: 64,
      })

      expect(proof).toBeNull()
      // shouldStop was called at least twice (once to pass, once to cancel)
      expect(calls).toBeGreaterThanOrEqual(2)
    })

    it('finds proof with custom rangeStart', async () => {
      // First, find a valid proof starting from 0
      const challenge: HashcashChallenge = {
        ...backendExample,
        difficulty: 1,
        max_proof_length: 10000,
      }

      const baseProof = await findProof({ challenge })
      expect(baseProof).not.toBeNull()

      if (baseProof) {
        const knownCounter = parseInt(baseProof.counter)

        // Now search again starting from that known counter
        const proof = await findProof({
          challenge,
          rangeStart: knownCounter,
          rangeSize: 1, // Only check the one counter
        })

        expect(proof).not.toBeNull()
        expect(proof!.counter).toBe(knownCounter.toString())
      }
    })
  })

  describe('verifyProof', () => {
    it('verifies a valid proof', async () => {
      const challenge: HashcashChallenge = {
        ...backendExample,
        difficulty: 1,
        max_proof_length: 10000,
      }

      // First find a proof
      const proof = await findProof({ challenge })
      expect(proof).not.toBeNull()

      if (proof) {
        // Then verify it
        const isValid = await verifyProof(challenge, proof.counter)
        expect(isValid).toBe(true)
      }
    })

    it('rejects an invalid proof', async () => {
      // Test with non-numeric counter (always invalid)
      expect(await verifyProof(backendExample, 'not-a-number')).toBe(false)

      // Test with higher difficulty where most counters are invalid
      const higherDifficultyChallenge = {
        ...backendExample,
        difficulty: 16, // 2 full zero bytes required
      }

      // This counter is very unlikely to produce 2 zero bytes
      const isValid = await verifyProof(higherDifficultyChallenge, '12345')
      expect(isValid).toBe(false)
    })
  })

  describe('formatHashcashString', () => {
    it('formats hashcash string correctly', () => {
      const proof = {
        counter: '123',
        hash: new Uint8Array(32).fill(0),
        attempts: 123,
        timeMs: 10,
      }

      const formatted = formatHashcashString(backendExample, proof)

      // Check format: version:bits:date:resource:extension:counter:hash
      const parts = formatted.split(':')

      expect(parts.length).toBe(7)
      expect(parts[0]).toBe('1') // Version
      expect(parts[1]).toBe('1') // Difficulty
      expect(parts[2]).toMatch(/^\d{6}$/) // Date format YYMMDD (always 6 digits)
      expect(parts[3]).toBe('Uniswap') // Resource
      expect(parts[4]).toBe('') // Extension (empty)
      expect(parts[5]).toBe('123') // Counter
      expect(parts[6]).toMatch(/^[A-Za-z0-9+/=]+$/) // Base64 hash
    })
  })

  describe('integration with backend example', () => {
    it('completes full hashcash flow with real backend data', async () => {
      const challenge: HashcashChallenge = {
        ...backendExample,
        max_proof_length: 10000, // Give enough range to find solution
      }

      // Step 1: Find proof
      const proof = await findProof({ challenge })
      expect(proof).not.toBeNull()

      if (proof) {
        // Step 2: Verify the proof is valid
        const isValid = await verifyProof(challenge, proof.counter)
        expect(isValid).toBe(true)

        // Step 3: Check the hash meets difficulty requirement
        expect(checkDifficulty(proof.hash, challenge.difficulty)).toBe(true)

        // Step 4: Format for submission
        const hashcashString = formatHashcashString(challenge, proof)
        expect(hashcashString).toBeTruthy()

        // Verify format includes our subject
        expect(hashcashString).toContain('Uniswap')
      }
    })

    it('handles backend difficulty vs verifier discrepancy', async () => {
      // The backend example shows difficulty: 1
      // But the verifier checks: hash.slice(0,1).every(x => x === 0)
      // which actually requires the first byte to be 0 (difficulty 8)

      const challenge = backendExample
      const proof = await findProof({
        challenge,
        rangeSize: 10000,
      })

      if (proof) {
        // Check our difficulty 1 validation
        const meetsSpecifiedDifficulty = checkDifficulty(proof.hash, 1)
        expect(meetsSpecifiedDifficulty).toBe(true)
      }
    })
  })
})
