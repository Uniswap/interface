import { Token } from '@uniswap/sdk-core'
import {
  deepMergeWithNullRemove,
  flattenObjectOfObjects,
  sortKeysRecursively,
  unnestObject,
} from 'utilities/src/primitives/objects'

const DAI = new Token(1, '0x6b175474e89094c44da98b954eedeac495271d0f', 18, 'DAI', 'Dai Stablecoin')

const USDC = new Token(1, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD Coin')

const USDC_ARBITRUM = new Token(42161, '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', 6, 'USDC', 'USD Coin')

describe(flattenObjectOfObjects, () => {
  it('correctly flattens', () => {
    expect(flattenObjectOfObjects({})).toEqual([])

    expect(flattenObjectOfObjects({ 1: {}, 4: {} })).toEqual([])

    expect(
      flattenObjectOfObjects({
        1: {
          [DAI.address]: DAI,
          [USDC.address]: USDC,
        },
        5: {},
        42161: {
          [USDC_ARBITRUM.address]: USDC_ARBITRUM,
        },
      }),
    ).toEqual([DAI, USDC, USDC_ARBITRUM])

    expect(flattenObjectOfObjects({ 1: { '0x1': [1, 2, 3], '0x2': 4 } })).toEqual([[1, 2, 3], 4])
  })
})

describe(unnestObject, () => {
  it('handles simple objects', () => {
    expect(unnestObject({ a: '1', b: 1 })).toEqual({ a: '1', b: 1 })
    expect(unnestObject({ a: { b: 1, c: '1' } })).toEqual({ 'a.b': 1, 'a.c': '1' })
  })

  it('handles arrays', () => {
    expect(unnestObject({ a: ['constructor', 2, 3], b: [{ c: 1 }, { d: 2 }] })).toEqual({
      'a.0': 'constructor',
      'a.1': 2,
      'a.2': 3,
      'b.0.c': 1,
      'b.1.d': 2,
    })
  })
})

describe(sortKeysRecursively, () => {
  it('should sort the keys of an object', () => {
    const obj = { b: 2, f: 1, d: 3, c: 4, e: 5, a: 6 }
    const result = JSON.stringify(sortKeysRecursively(obj))
    expect(result).toBe('{"a":6,"b":2,"c":4,"d":3,"e":5,"f":1}')
  })

  it('should handle an empty object', () => {
    const obj = {}
    const result = JSON.stringify(sortKeysRecursively(obj))
    expect(result).toBe('{}')
  })

  it('should handle an object with arrays without sorting the arrays', () => {
    const obj = { b: [3, '2', 1], a: [1, 2, '3'] }
    const result = JSON.stringify(sortKeysRecursively(obj))
    expect(result).toBe(`{"a":[1,2,"3"],"b":[3,"2",1]}`)
  })

  it('should handle deep nested objects', () => {
    const obj = {
      a: {
        d: { b: 2, a: 1 },
        c: { z: 10, a: { x: { b: 'test', a: 'blah', x: null } } },
      },
      b: 1,
    }
    const result = JSON.stringify(sortKeysRecursively(obj))
    expect(result).toBe(`{"a":{"c":{"a":{"x":{"a":"blah","b":"test","x":null}},"z":10},"d":{"a":1,"b":2}},"b":1}`)
  })
})

describe(deepMergeWithNullRemove, () => {
  it('should merge simple objects', () => {
    const base = { a: 1, b: 2 }
    const override = { c: 3, d: 4 }
    const result = deepMergeWithNullRemove(base, override)

    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 })
  })

  it('should override primitive values', () => {
    const base = { a: 1, b: 2 }
    const override = { b: 3, c: 4 }
    const result = deepMergeWithNullRemove(base, override)

    expect(result).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('should deep merge nested objects', () => {
    const base = {
      rules: {
        style: {
          rule1: 'error',
          rule2: 'warn',
        },
      },
    }
    const override = {
      rules: {
        style: {
          rule2: 'off',
          rule3: 'error',
        },
        correctness: {
          rule4: 'error',
        },
      },
    }
    const result = deepMergeWithNullRemove(base, override)

    expect(result).toEqual({
      rules: {
        style: {
          rule1: 'error',
          rule2: 'off',
          rule3: 'error',
        },
        correctness: {
          rule4: 'error',
        },
      },
    })
  })

  it('should merge and deduplicate arrays', () => {
    const base = { includes: ['**/*.ts', '**/*.js'] }
    const override = { includes: ['**/*.tsx', '**/*.ts'] }
    const result = deepMergeWithNullRemove(base, override)

    expect(result.includes).toEqual(['**/*.ts', '**/*.js', '**/*.tsx'])
    expect(result.includes).toHaveLength(3) // Should be deduplicated
  })

  it('should replace non-array with array', () => {
    const base = { includes: 'some-string' }
    const override = { includes: ['**/*.ts', '**/*.js'] }
    const result = deepMergeWithNullRemove(base, override)

    expect(result.includes).toEqual(['**/*.ts', '**/*.js'])
  })

  it('should handle null values by removing keys', () => {
    const base = { a: 1, b: 2, c: 3 }
    const override = { b: null, d: 4 }
    const result = deepMergeWithNullRemove(base, override)

    expect(result).toEqual({ a: 1, c: 3, d: 4 })
    expect(result).not.toHaveProperty('b')
  })

  it('should merge complex biome config structures', () => {
    const base = {
      linter: {
        rules: {
          style: {
            noRestrictedImports: {
              level: 'error',
              options: {
                paths: {
                  'path-a': {
                    message: 'Message A',
                  },
                },
              },
            },
          },
        },
      },
      overrides: [
        {
          includes: ['**/*.test.ts'],
          linter: {
            rules: {
              style: {
                noNonNullAssertion: 'off',
              },
            },
          },
        },
      ],
    }

    const override = {
      linter: {
        rules: {
          style: {
            noRestrictedImports: {
              options: {
                paths: {
                  'path-b': {
                    message: 'Message B',
                  },
                },
              },
            },
          },
          correctness: {
            useExhaustiveDependencies: 'error',
          },
        },
      },
      overrides: [
        {
          includes: ['scripts/**'],
          linter: {
            enabled: false,
          },
        },
      ],
    }

    const result = deepMergeWithNullRemove(base, override)

    expect(result.linter.rules.style.noRestrictedImports.level).toBe('error')
    expect(result.linter.rules.style.noRestrictedImports.options.paths).toEqual({
      'path-a': { message: 'Message A' },
      'path-b': { message: 'Message B' },
    })
    expect(result.linter.rules.correctness.useExhaustiveDependencies).toBe('error')
    expect(result.overrides).toHaveLength(2)
    expect(result.overrides[0]?.includes).toContain('**/*.test.ts')
    expect(result.overrides[1]?.includes).toContain('scripts/**')
  })

  it('should preserve array order and deduplicate', () => {
    const base = { arr: [1, 2, 3] }
    const override = { arr: [3, 4, 5, 1] }
    const result = deepMergeWithNullRemove(base, override)

    expect(result.arr).toEqual([1, 2, 3, 4, 5])
  })

  it('should handle empty objects and arrays', () => {
    const base = { obj: {}, arr: [] as string[] }
    const override = { obj: { a: 1 }, arr: ['item'] }
    const result = deepMergeWithNullRemove(base, override)

    expect(result).toEqual({
      obj: { a: 1 },
      arr: ['item'],
    })
  })

  it('should not modify original objects', () => {
    const base = { a: { b: 1 } }
    const override = { a: { c: 2 } }
    const originalBase = JSON.parse(JSON.stringify(base))
    const originalOverride = JSON.parse(JSON.stringify(override))

    deepMergeWithNullRemove(base, override)

    expect(base).toEqual(originalBase)
    expect(override).toEqual(originalOverride)
  })

  it('should handle test file override inheritance', () => {
    const baseConfig = {
      overrides: [
        {
          includes: ['**/*.test.ts', '**/*.test.tsx'],
          linter: {
            rules: {
              style: {
                noNonNullAssertion: 'off',
              },
              suspicious: {
                noExplicitAny: 'off',
              },
            },
          },
        },
      ],
    }

    const appConfig = {
      linter: {
        rules: {
          style: {
            noRestrictedImports: {
              level: 'error',
              options: {
                paths: {
                  'some-path': {
                    message: 'Custom message',
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = deepMergeWithNullRemove(baseConfig, appConfig)

    expect(result.overrides).toHaveLength(1)
    expect(result.overrides[0]?.linter.rules.style.noNonNullAssertion).toBe('off')
    expect(result.linter.rules.style.noRestrictedImports.level).toBe('error')
  })

  it('should merge experimentalScannerIgnores arrays', () => {
    const base = {
      files: {
        experimentalScannerIgnores: ['*.tsbuildinfo', '__generated__/**', '*.json'],
      },
    }

    const override = {
      files: {
        experimentalScannerIgnores: [
          '.maestro/**',
          '*.json', // duplicate should be removed
          'ios/**',
        ],
      },
    }

    const result = deepMergeWithNullRemove(base, override)

    expect(result.files.experimentalScannerIgnores).toEqual([
      '*.tsbuildinfo',
      '__generated__/**',
      '*.json',
      '.maestro/**',
      'ios/**',
    ])
    expect(result.files.experimentalScannerIgnores).toHaveLength(5) // No duplicates
  })

  it('should handle undefined and falsy values correctly', () => {
    const base = { a: 1, b: false, c: 0, d: '' }
    const override = { b: true, c: null, e: undefined }
    const result = deepMergeWithNullRemove(base, override)

    expect(result).toEqual({ a: 1, b: true, d: '', e: undefined })
    expect(result).not.toHaveProperty('c')
  })

  it('should handle nested arrays correctly', () => {
    const base = {
      config: {
        items: ['a', 'b'],
      },
    }
    const override = {
      config: {
        items: ['c', 'a'], // 'a' should be deduplicated
      },
    }
    const result = deepMergeWithNullRemove(base, override)

    expect(result.config.items).toEqual(['a', 'b', 'c'])
  })
})
