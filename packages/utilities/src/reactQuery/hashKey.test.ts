import { hashKey, normalizeArrays } from 'utilities/src/reactQuery/hashKey'

describe('normalizeArrays', () => {
  it('should sort arrays of numbers', () => {
    const obj = { chainIds: [42161, 1, 137, 10] }
    const result = normalizeArrays(obj)
    expect(result).toEqual({ chainIds: [10, 137, 1, 42161] })
  })

  it('should sort arrays of strings', () => {
    const obj = { tags: ['z', 'a', 'b'] }
    const result = normalizeArrays(obj)
    expect(result).toEqual({ tags: ['a', 'b', 'z'] })
  })

  it('should sort arrays of mixed types', () => {
    const obj = { mixed: ['zebra', 42, 'apple', 1, 'banana'] }
    const result = normalizeArrays(obj)

    expect(result).toEqual({ mixed: ['apple', 'banana', 'zebra', 1, 42] })
  })

  it('should sort nested arrays', () => {
    const obj = {
      nested: {
        tags: ['zebra', 'apple'],
        chainIds: [42161, 1, 137],
      },
    }
    const result = normalizeArrays(obj)
    expect(result).toEqual({
      nested: {
        chainIds: [137, 1, 42161],
        tags: ['apple', 'zebra'],
      },
    })
  })

  it('should handle null, undefined and primitive values', () => {
    expect(normalizeArrays(null)).toBe(null)
    expect(normalizeArrays(undefined)).toBe(undefined)

    const obj = { a: null, b: undefined, c: [3, 1, 2] }
    const result = normalizeArrays(obj)
    expect(result).toEqual({ a: null, b: undefined, c: [1, 2, 3] })

    expect(normalizeArrays(42)).toBe(42)
    expect(normalizeArrays('hello')).toBe('hello')
    expect(normalizeArrays(true)).toBe(true)
  })
})

describe('hashKey integration', () => {
  it('should produce consistent hashes for arrays in different orders', () => {
    const key1 = ['users', { filters: ['admin', 'active'] }]
    const key2 = ['users', { filters: ['active', 'admin'] }]

    const hash1 = hashKey(key1)
    const hash2 = hashKey(key2)

    expect(hash1).toBe(hash2)
  })

  it('should produce different hashes for different arrays', () => {
    const key1 = ['users', { filters: ['admin', 'active'] }]
    const key2 = ['users', { filters: ['admin', 'inactive'] }]

    const hash1 = hashKey(key1)
    const hash2 = hashKey(key2)

    expect(hash1).not.toBe(hash2)
  })
})
