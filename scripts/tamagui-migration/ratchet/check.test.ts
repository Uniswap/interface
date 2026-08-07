/**
 * Tests for the converted-directory ratchet enforced by dangerfile.ts (INFRA-2957).
 * Run with `bun test scripts/tamagui-migration`
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findRatchetViolations, parseRatchetConfig } from './check'

const CONVERTED = ['apps/web/src/pages/Swap', 'packages/uniswap/src/features/tokens']

describe('findRatchetViolations', () => {
  test('fails a ui/src barrel import added under a converted directory', () => {
    const violations = findRatchetViolations({
      filePath: 'apps/web/src/pages/Swap/SwapForm.tsx',
      addedLines: ["import { Flex } from 'ui/src'"],
      convertedDirectories: CONVERTED,
    })
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('apps/web/src/pages/Swap/SwapForm.tsx')
    expect(violations[0]).toContain("'ui/src'")
  })

  test('fails a ui/src deep import added under a nested subdirectory', () => {
    const violations = findRatchetViolations({
      filePath: 'apps/web/src/pages/Swap/components/inner/Row.tsx',
      addedLines: ["import { AlertTriangle } from 'ui/src/components/icons/AlertTriangle'"],
      convertedDirectories: CONVERTED,
    })
    expect(violations).toHaveLength(1)
  })

  test('fails a direct tamagui import added under a converted directory', () => {
    const violations = findRatchetViolations({
      filePath: 'packages/uniswap/src/features/tokens/TokenRow.tsx',
      addedLines: ["import { styled } from 'tamagui'"],
      convertedDirectories: CONVERTED,
    })
    expect(violations).toHaveLength(1)
  })

  test('reports one violation per offending added line', () => {
    const violations = findRatchetViolations({
      filePath: 'apps/web/src/pages/Swap/SwapForm.tsx',
      addedLines: ["import { Flex } from 'ui/src'", "import { Text } from 'ui/src'", 'const x = 1'],
      convertedDirectories: CONVERTED,
    })
    expect(violations).toHaveLength(2)
  })

  test('ignores files outside converted directories', () => {
    const violations = findRatchetViolations({
      filePath: 'apps/web/src/pages/Explore/ExplorePage.tsx',
      addedLines: ["import { Flex } from 'ui/src'"],
      convertedDirectories: CONVERTED,
    })
    expect(violations).toHaveLength(0)
  })

  test('does not treat a sibling directory sharing a prefix as converted', () => {
    const violations = findRatchetViolations({
      filePath: 'apps/web/src/pages/SwapFlow/Widget.tsx',
      addedLines: ["import { Flex } from 'ui/src'"],
      convertedDirectories: CONVERTED,
    })
    expect(violations).toHaveLength(0)
  })

  test('ignores unrelated added lines under a converted directory', () => {
    const violations = findRatchetViolations({
      filePath: 'apps/web/src/pages/Swap/SwapForm.tsx',
      addedLines: ["import { Flex } from '@universe/mycelium'", 'const total = amount + fee'],
      convertedDirectories: CONVERTED,
    })
    expect(violations).toHaveLength(0)
  })

  test('returns nothing when no directories are ratcheted yet', () => {
    const violations = findRatchetViolations({
      filePath: 'apps/web/src/pages/Swap/SwapForm.tsx',
      addedLines: ["import { Flex } from 'ui/src'"],
      convertedDirectories: [],
    })
    expect(violations).toHaveLength(0)
  })
})

describe('parseRatchetConfig', () => {
  test('parses the checked-in ratchet.json', () => {
    const raw = readFileSync(join(import.meta.dir, 'ratchet.json'), 'utf8')
    const config = parseRatchetConfig(raw)
    expect(Array.isArray(config.convertedDirectories)).toBe(true)
  })

  test('throws on a missing convertedDirectories key', () => {
    expect(() => parseRatchetConfig('{}')).toThrow()
  })

  test('throws on non-string entries', () => {
    expect(() => parseRatchetConfig('{"convertedDirectories": [42]}')).toThrow()
  })

  test('throws on trailing-slash entries so prefix matching stays canonical', () => {
    expect(() => parseRatchetConfig('{"convertedDirectories": ["apps/web/src/pages/Swap/"]}')).toThrow()
  })
})
