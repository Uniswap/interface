/**
 *  Taken from https://github.com/Uniswap/tamperproof-transactions/blob/main/src/utils/canonicalJson.ts
 *  Can be removed if we decide to use the tamperproof-transactions package.
 */
import { canonicalStringify, serializeRequestPayload } from 'utilities/src/format/canonicalJson'

describe('canonicalJson utilities', () => {
  describe('canonicalStringify', () => {
    it('sorts object keys lexicographically', () => {
      const input = { b: 2, a: 1 }
      expect(canonicalStringify(input)).toBe('{"a":1,"b":2}')
    })

    it('drops properties with undefined values', () => {
      const input = { a: 1, b: undefined as unknown as never }
      expect(canonicalStringify(input)).toBe('{"a":1}')
    })

    it('handles nested objects and sorts nested keys', () => {
      const input = { z: { b: 2, a: 1 }, y: 0 }
      expect(canonicalStringify(input)).toBe('{"y":0,"z":{"a":1,"b":2}}')
    })

    it('canonicalizes objects inside arrays but preserves array order', () => {
      const input = [
        { b: 2, a: 1 },
        { d: 4, c: 3 },
      ]
      expect(canonicalStringify(input)).toBe('[{"a":1,"b":2},{"c":3,"d":4}]')
    })

    it('preserves null, boolean, number, and string values', () => {
      const input = { n: null, t: true, f: false, num: 42, s: 'x' }
      expect(canonicalStringify(input)).toBe('{"f":false,"n":null,"num":42,"s":"x","t":true}')
    })
  })

  describe('serializeRequestPayload', () => {
    it('encodes canonical JSON as UTF-8 bytes', () => {
      const payload = { method: 'm', params: { b: 2, a: 1 } }
      const expected = new TextEncoder().encode(canonicalStringify(payload))
      const actual = serializeRequestPayload(payload)
      expect(Array.from(actual)).toEqual(Array.from(expected))
    })

    it('drops undefined values before encoding', () => {
      const payload = {
        method: 'm',
        params: { a: 1, u: undefined as unknown as never },
      }
      const encoded = serializeRequestPayload(payload)
      const decoded = new TextDecoder().decode(encoded)
      expect(decoded).toBe('{"method":"m","params":{"a":1}}')
    })
  })
})
