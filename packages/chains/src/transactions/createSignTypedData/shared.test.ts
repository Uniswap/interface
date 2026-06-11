import { describe, expect, it } from 'vitest'
import { type PermitTypes, normalizeTypes, shouldFallbackToEthSign } from './shared'

describe('shouldFallbackToEthSign', () => {
  describe('returns true for known fallback patterns', () => {
    it.each([
      'method not found',
      'method not implemented',
      'Method Not Found', // case-insensitive
      'eth_signTypedData_v4 is not implemented',
      'Result: not found',
      'TrustWalletConnect.WCError error 1',
      'Some prefix: TrustWalletConnect.WCError error 1 with suffix',
      'Missing or invalid',
      'Missing or invalid params',
    ])('matches "%s"', (message) => {
      expect(shouldFallbackToEthSign({ message })).toBe(true)
    })

    it('matches an Error instance whose message hits a pattern', () => {
      expect(shouldFallbackToEthSign(new Error('method not found'))).toBe(true)
    })
  })

  describe('returns false for non-fallback inputs', () => {
    it.each(['User rejected the request', 'Internal JSON-RPC error', 'Insufficient funds for gas'])(
      'does not match "%s"',
      (message) => {
        expect(shouldFallbackToEthSign({ message })).toBe(false)
      },
    )

    it('returns false when the error is null', () => {
      expect(shouldFallbackToEthSign(null)).toBe(false)
    })

    it('returns false when the error is undefined', () => {
      expect(shouldFallbackToEthSign(undefined)).toBe(false)
    })

    it('returns false when the error has no message property', () => {
      expect(shouldFallbackToEthSign({})).toBe(false)
    })

    it('returns false when error.message is not a string', () => {
      expect(shouldFallbackToEthSign({ message: 42 })).toBe(false)
      expect(shouldFallbackToEthSign({ message: { nested: true } })).toBe(false)
      expect(shouldFallbackToEthSign({ message: null })).toBe(false)
    })

    it('returns false when the error is a primitive (no message)', () => {
      expect(shouldFallbackToEthSign('method not found')).toBe(false)
      expect(shouldFallbackToEthSign(42)).toBe(false)
    })
  })
})

describe('normalizeTypes', () => {
  const personFields = [
    { name: 'name', type: 'string' },
    { name: 'wallet', type: 'address' },
  ]
  const mailFields = [
    { name: 'from', type: 'Person' },
    { name: 'to', type: 'Person' },
    { name: 'contents', type: 'string' },
  ]

  it('returns an empty object when given empty types', () => {
    expect(normalizeTypes({})).toEqual({})
  })

  it('passes through the Trading API format (already an array)', () => {
    const types: PermitTypes = { Person: personFields, Mail: mailFields }
    expect(normalizeTypes(types)).toEqual({ Person: personFields, Mail: mailFields })
  })

  it('flattens the Liquidity API format ({ fields: [...] }) to arrays', () => {
    const types: PermitTypes = {
      Person: { fields: personFields },
      Mail: { fields: mailFields },
    }
    expect(normalizeTypes(types)).toEqual({ Person: personFields, Mail: mailFields })
  })

  it('preserves only the `name` and `type` of each field (drops extras)', () => {
    const types: PermitTypes = {
      Person: {
        fields: [
          { name: 'name', type: 'string', extra: 'should be dropped' } as any,
          { name: 'wallet', type: 'address', meta: { ignored: true } } as any,
        ],
      },
    }
    expect(normalizeTypes(types)).toEqual({
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
    })
  })

  it('handles a mixed-format input where some types are arrays and others are wrapped', () => {
    const types: PermitTypes = {
      Person: personFields as any,
      Mail: { fields: mailFields } as any,
    }
    expect(normalizeTypes(types)).toEqual({ Person: personFields, Mail: mailFields })
  })

  it('treats a value that has `fields` but is not an array as the Trading API path', () => {
    // Defensive: only objects with `fields: Field[]` (Array.isArray) are
    // treated as Liquidity API. Anything else passes through unchanged.
    const types: PermitTypes = {
      Weird: [{ name: 'fields', type: 'string' }] as any,
    }
    expect(normalizeTypes(types)).toEqual({ Weird: [{ name: 'fields', type: 'string' }] })
  })

  it('returns a fresh object (does not mutate inputs)', () => {
    const original = { Person: personFields }
    const result = normalizeTypes(original)
    expect(result).not.toBe(original)
    // Trading API path passes the array through by reference
    expect(result.Person).toBe(personFields)
  })

  it('returns fresh field objects when normalizing the Liquidity API format', () => {
    const types: PermitTypes = { Person: { fields: personFields } }
    const result = normalizeTypes(types)
    // Mapped to new array of new objects
    expect(result.Person).not.toBe(personFields)
    expect(result.Person).toEqual(personFields)
  })
})
