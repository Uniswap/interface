import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { parse as parseJsonc } from 'jsonc-parser'
import { extractGlobalRuleValues } from './extractor.js'
import { processConfig } from './processor.js'

/**
 * Helper to load and process a fixture file
 */
function processFixture(fixtureName) {
  const fixturePath = path.join(__dirname, 'fixtures', fixtureName)
  const content = fs.readFileSync(fixturePath, 'utf8')
  const config = parseJsonc(content)
  const globalRules = extractGlobalRuleValues(config)
  return processConfig(config, globalRules)
}

describe('Biome Config Processor', () => {
  describe('Object Marker Resolution', () => {
    test('should merge global paths with override paths', () => {
      const result = processFixture('simple-config.jsonc')

      const override = result.overrides[0]
      const paths = override.linter.rules.style.noRestrictedImports.options.paths

      // Should include both global and override paths
      expect(paths).toMatchObject({
        lodash: 'Use lodash-es instead',
        moment: 'Use date-fns instead',
        react: 'Use preact in tests',
      })

      // Should not include marker
      expect(paths.__INCLUDE_GLOBAL_VALUES__).toBeUndefined()
    })

    test('should handle "off" overrides correctly', () => {
      const result = processFixture('off-override-config.jsonc')

      const override = result.overrides[0]
      const paths = override.linter.rules.style.noRestrictedImports.options.paths

      // Should include global paths except the one turned off
      expect(paths.lodash).toBe('Use lodash-es instead')
      expect(paths.moment).toBe('Use date-fns instead')

      // Should not include the "off" path
      expect(paths.jquery).toBeUndefined()

      // Should include override-specific path
      expect(paths.axios).toBe('Use fetch instead')

      // Should not include marker
      expect(paths.__INCLUDE_GLOBAL_VALUES__).toBeUndefined()
    })
  })

  describe('Array Marker Resolution', () => {
    test('should merge global array with override array', () => {
      const result = processFixture('array-merge-config.jsonc')

      const override = result.overrides[0]
      const patterns = override.linter.rules.style.noRestrictedImports.options.patterns

      // Should include both global and override items
      expect(patterns).toEqual(
        expect.arrayContaining([
          {
            group: ['global/*'],
            message: 'Please do not import from global',
          },
          {
            group: ['localStorage/*'],
            message: 'Please do not import from localStorage',
          },
          {
            group: ['sessionStorage/*'],
            message: 'Please do not import from sessionStorage',
          },
        ]),
      )

      // Should not include marker
      expect(patterns).not.toContain('__INCLUDE_GLOBAL_VALUES__')
    })

    test('should deduplicate merged arrays', () => {
      const config = {
        linter: {
          rules: {
            style: {
              noRestrictedImports: {
                level: 'error',
                options: {
                  patterns: [
                    {
                      group: ['event/*'],
                      message: 'Do not import from event',
                    },
                    {
                      group: ['name/*'],
                      message: 'Do not import from name',
                    },
                  ],
                },
              },
            },
          },
        },
        overrides: [
          {
            include: ['src/**'],
            linter: {
              rules: {
                style: {
                  noRestrictedImports: {
                    level: 'error',
                    options: {
                      patterns: [
                        '__INCLUDE_GLOBAL_VALUES__',
                        {
                          group: ['event/*'],
                          message: 'Do not import from event',
                        },
                        {
                          group: ['localStorage/*'],
                          message: 'Do not import from localStorage',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        ],
      }

      const globalRules = extractGlobalRuleValues(config)
      const result = processConfig(config, globalRules)

      const patterns = result.overrides[0].linter.rules.style.noRestrictedImports.options.patterns

      // Should not have duplicates
      const eventPatterns = patterns.filter((x) => JSON.stringify(x.group) === JSON.stringify(['event/*']))
      expect(eventPatterns).toHaveLength(1)

      // Should maintain override order (local items first)
      expect(patterns[0]).toMatchObject({
        group: ['event/*'],
        message: 'Do not import from event',
      })
      expect(patterns[1]).toMatchObject({
        group: ['localStorage/*'],
        message: 'Do not import from localStorage',
      })
      expect(patterns[2]).toMatchObject({
        group: ['name/*'],
        message: 'Do not import from name',
      })
    })
  })

  describe('No Markers', () => {
    test('should not modify overrides without markers', () => {
      const result = processFixture('no-markers-config.jsonc')

      const override = result.overrides[0]
      const paths = override.linter.rules.style.noRestrictedImports.options.paths

      // Should only have override path
      expect(paths).toMatchObject({
        react: 'Custom restriction',
      })

      // Should not include global paths
      expect(paths.lodash).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    test('should handle config with no overrides', () => {
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

      const globalRules = extractGlobalRuleValues(config)
      const result = processConfig(config, globalRules)

      // Should return unchanged
      expect(result).toEqual(config)
    })

    test('should handle override without linter rules', () => {
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
        overrides: [
          {
            include: ['src/**'],
            formatter: {
              enabled: false,
            },
          },
        ],
      }

      const globalRules = extractGlobalRuleValues(config)
      const result = processConfig(config, globalRules)

      // Should handle override without linter rules gracefully
      expect(result.overrides[0]).toMatchObject({
        include: ['src/**'],
        formatter: {
          enabled: false,
        },
      })
    })

    test('should handle empty global rules', () => {
      const config = {
        linter: {
          rules: {},
        },
        overrides: [
          {
            include: ['src/**'],
            linter: {
              rules: {
                style: {
                  noRestrictedImports: {
                    level: 'error',
                    options: {
                      paths: {
                        __INCLUDE_GLOBAL_VALUES__: true,
                        react: 'Custom restriction',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      }

      const globalRules = extractGlobalRuleValues(config)
      const result = processConfig(config, globalRules)

      const paths = result.overrides[0].linter.rules.style.noRestrictedImports.options.paths

      // Should only include override paths
      expect(paths).toMatchObject({
        react: 'Custom restriction',
      })

      // Should remove marker
      expect(paths.__INCLUDE_GLOBAL_VALUES__).toBeUndefined()
    })
  })

  describe('Immutability', () => {
    test('should not mutate original config', () => {
      const originalConfig = {
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
        overrides: [
          {
            include: ['src/**'],
            linter: {
              rules: {
                style: {
                  noRestrictedImports: {
                    level: 'error',
                    options: {
                      paths: {
                        __INCLUDE_GLOBAL_VALUES__: true,
                        react: 'Custom restriction',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      }

      const globalRules = extractGlobalRuleValues(originalConfig)
      processConfig(originalConfig, globalRules)

      // Original config should still have the marker
      expect(
        originalConfig.overrides[0].linter.rules.style.noRestrictedImports.options.paths.__INCLUDE_GLOBAL_VALUES__,
      ).toBe(true)
    })
  })
})
