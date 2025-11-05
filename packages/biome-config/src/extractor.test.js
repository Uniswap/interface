import { describe, expect, test } from 'bun:test'
import { extractGlobalRuleValues } from './extractor.js'

describe('extractGlobalRuleValues', () => {
  test('should extract simple rule values', () => {
    const config = {
      linter: {
        rules: {
          style: {
            noRestrictedImports: {
              level: 'error',
              options: {
                paths: {
                  lodash: 'Use lodash-es',
                },
              },
            },
          },
        },
      },
    }

    const result = extractGlobalRuleValues(config)

    expect(result.has('linter.rules.style.noRestrictedImports')).toBe(true)
    expect(result.get('linter.rules.style.noRestrictedImports')).toMatchObject({
      level: 'error',
      options: {
        paths: {
          lodash: 'Use lodash-es',
        },
      },
    })
  })

  test('should extract nested rule values', () => {
    const config = {
      linter: {
        rules: {
          complexity: {
            noExtraBooleanCast: {
              level: 'error',
            },
          },
          style: {
            noNegationElse: {
              level: 'warn',
            },
          },
        },
      },
    }

    const result = extractGlobalRuleValues(config)

    expect(result.size).toBe(2)
    expect(result.has('linter.rules.complexity.noExtraBooleanCast')).toBe(true)
    expect(result.has('linter.rules.style.noNegationElse')).toBe(true)
  })

  test('should handle config without linter rules', () => {
    const config = {
      formatter: {
        enabled: true,
      },
    }

    const result = extractGlobalRuleValues(config)

    expect(result.size).toBe(0)
  })

  test('should handle empty linter rules', () => {
    const config = {
      linter: {
        rules: {},
      },
    }

    const result = extractGlobalRuleValues(config)

    expect(result.size).toBe(0)
  })

  test('should only extract objects with level or options', () => {
    const config = {
      linter: {
        rules: {
          style: {
            noRestrictedImports: {
              level: 'error',
              options: {
                paths: {
                  lodash: 'Use lodash-es',
                },
              },
            },
            someOtherKey: {
              randomProperty: 'value',
            },
          },
        },
      },
    }

    const result = extractGlobalRuleValues(config)

    // Should only extract the rule with level/options
    expect(result.size).toBe(1)
    expect(result.has('linter.rules.style.noRestrictedImports')).toBe(true)
    expect(result.has('linter.rules.style.someOtherKey')).toBe(false)
  })

  test('should not walk into arrays', () => {
    const config = {
      linter: {
        rules: {
          style: {
            noRestrictedGlobals: {
              level: 'error',
              options: {
                deniedGlobals: ['event', 'name'],
              },
            },
          },
        },
      },
    }

    const result = extractGlobalRuleValues(config)

    expect(result.size).toBe(1)
    expect(result.has('linter.rules.style.noRestrictedGlobals')).toBe(true)

    const rule = result.get('linter.rules.style.noRestrictedGlobals')
    expect(Array.isArray(rule.options.deniedGlobals)).toBe(true)
  })
})
