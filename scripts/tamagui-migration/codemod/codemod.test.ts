/**
 * Fixture suite for the Tamagui→Mycelium conversion codemod (INFRA-2957).
 * Run with `bun test scripts/tamagui-migration`
 *
 * Fixture contract — each directory under ./fixtures holds:
 * - `input.tsx` (always): the file handed to the codemod
 * - `expected.tsx` present: the codemod must convert and produce exactly this output
 * - `expected.flags.json` present: the codemod must route the file to the manual lane
 *   with exactly these reasons and must not edit it
 * - neither: the file is out of the codemod's scope and must be reported clean
 */
import { describe, expect, test } from 'bun:test'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runCodemodOnSource } from './driver'

const FIXTURES_DIR = join(import.meta.dir, 'fixtures')

// Manual-lane flag cases that must always have fixture coverage (playbook §4 wk 2 exit)
const MANDATORY_FLAG_FIXTURES = [
  'flag-mixed-import',
  'flag-styled',
  'flag-animation-prop',
  'flag-group-state-prop',
  'flag-spread-props',
]

const fixtureNames = readdirSync(FIXTURES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

describe('codemod fixture suite', () => {
  test('every mandatory manual-lane flag case has a fixture', () => {
    for (const name of MANDATORY_FLAG_FIXTURES) {
      expect(fixtureNames).toContain(name)
      expect(existsSync(join(FIXTURES_DIR, name, 'expected.flags.json'))).toBe(true)
    }
  })

  for (const name of fixtureNames) {
    const dir = join(FIXTURES_DIR, name)
    const expectedPath = join(dir, 'expected.tsx')
    const flagsPath = join(dir, 'expected.flags.json')

    test(name, () => {
      const input = readFileSync(join(dir, 'input.tsx'), 'utf8')
      const result = runCodemodOnSource(input)

      if (existsSync(expectedPath)) {
        const expected = readFileSync(expectedPath, 'utf8')
        expect(result.status).toBe('converted')
        if (result.status === 'converted') {
          expect(result.output).toBe(expected)
        }
      } else if (existsSync(flagsPath)) {
        const expectedFlags = JSON.parse(readFileSync(flagsPath, 'utf8')) as { reasons: string[] }
        expect(result.status).toBe('flagged')
        if (result.status === 'flagged') {
          const actualReasons: string[] = [...result.reasons].sort()
          expect(actualReasons).toEqual([...expectedFlags.reasons].sort())
        }
      } else {
        expect(result.status).toBe('clean')
      }
    })
  }
})
