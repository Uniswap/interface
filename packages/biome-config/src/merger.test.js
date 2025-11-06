import { describe, expect, test } from 'bun:test'
import { mergeArrayValues, mergeObjectValues } from './merger.js'

describe('mergeObjectValues', () => {
  test('should merge global and local object values', () => {
    const global = {
      lodash: 'Use lodash-es',
      moment: 'Use date-fns',
    }

    const local = {
      __INCLUDE_GLOBAL_VALUES__: true,
      react: 'Custom restriction',
    }

    const result = mergeObjectValues(global, local)

    expect(result).toMatchObject({
      lodash: 'Use lodash-es',
      moment: 'Use date-fns',
      react: 'Custom restriction',
    })

    expect(result.__INCLUDE_GLOBAL_VALUES__).toBeUndefined()
  })

  test('should prioritize local values over global', () => {
    const global = {
      lodash: 'Use lodash-es',
      moment: 'Use date-fns',
    }

    const local = {
      __INCLUDE_GLOBAL_VALUES__: true,
      lodash: 'Lodash is fine actually',
    }

    const result = mergeObjectValues(global, local)

    expect(result.lodash).toBe('Lodash is fine actually')
    expect(result.moment).toBe('Use date-fns')
  })

  test('should handle "off" overrides', () => {
    const global = {
      lodash: 'Use lodash-es',
      moment: 'Use date-fns',
      jquery: 'No jQuery',
    }

    const local = {
      __INCLUDE_GLOBAL_VALUES__: true,
      jquery: 'off',
      react: 'Custom restriction',
    }

    const result = mergeObjectValues(global, local)

    expect(result.lodash).toBe('Use lodash-es')
    expect(result.moment).toBe('Use date-fns')
    expect(result.jquery).toBeUndefined()
    expect(result.react).toBe('Custom restriction')
  })

  test('should remove marker from result', () => {
    const global = {
      lodash: 'Use lodash-es',
    }

    const local = {
      __INCLUDE_GLOBAL_VALUES__: true,
      react: 'Custom restriction',
    }

    const result = mergeObjectValues(global, local)

    expect(result.__INCLUDE_GLOBAL_VALUES__).toBeUndefined()
  })

  test('should handle empty global object', () => {
    const global = {}

    const local = {
      __INCLUDE_GLOBAL_VALUES__: true,
      react: 'Custom restriction',
    }

    const result = mergeObjectValues(global, local)

    expect(result).toMatchObject({
      react: 'Custom restriction',
    })
  })

  test('should handle empty local object (except marker)', () => {
    const global = {
      lodash: 'Use lodash-es',
    }

    const local = {
      __INCLUDE_GLOBAL_VALUES__: true,
    }

    const result = mergeObjectValues(global, local)

    expect(result).toMatchObject({
      lodash: 'Use lodash-es',
    })
  })
})

describe('mergeArrayValues', () => {
  test('should merge global and local arrays', () => {
    const global = ['event', 'name', 'global']
    const local = ['__INCLUDE_GLOBAL_VALUES__', 'localStorage', 'sessionStorage']

    const result = mergeArrayValues(global, local)

    expect(result).toEqual(['localStorage', 'sessionStorage', 'event', 'name', 'global'])
  })

  test('should deduplicate merged arrays', () => {
    const global = ['event', 'name', 'global']
    const local = ['__INCLUDE_GLOBAL_VALUES__', 'event', 'localStorage']

    const result = mergeArrayValues(global, local)

    // Should not have duplicates
    expect(result.filter((x) => x === 'event')).toHaveLength(1)

    // Should maintain local precedence (local items first)
    expect(result).toEqual(['event', 'localStorage', 'name', 'global'])
  })

  test('should remove marker from result', () => {
    const global = ['event', 'name']
    const local = ['__INCLUDE_GLOBAL_VALUES__', 'localStorage']

    const result = mergeArrayValues(global, local)

    expect(result).not.toContain('__INCLUDE_GLOBAL_VALUES__')
  })

  test('should handle empty global array', () => {
    const global = []
    const local = ['__INCLUDE_GLOBAL_VALUES__', 'localStorage']

    const result = mergeArrayValues(global, local)

    expect(result).toEqual(['localStorage'])
  })

  test('should handle local array with only marker', () => {
    const global = ['event', 'name']
    const local = ['__INCLUDE_GLOBAL_VALUES__']

    const result = mergeArrayValues(global, local)

    expect(result).toEqual(['event', 'name'])
  })

  test('should deduplicate complex objects', () => {
    const global = [{ path: 'lodash', message: 'Use lodash-es' }]
    const local = [
      '__INCLUDE_GLOBAL_VALUES__',
      { path: 'lodash', message: 'Use lodash-es' },
      { path: 'moment', message: 'Use date-fns' },
      { message: 'Use date-fns', path: 'moment' },
    ]

    const result = mergeArrayValues(global, local)

    // Should deduplicate based on JSON serialization
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ path: 'lodash', message: 'Use lodash-es' })
    expect(result[1]).toMatchObject({ path: 'moment', message: 'Use date-fns' })
  })
})
