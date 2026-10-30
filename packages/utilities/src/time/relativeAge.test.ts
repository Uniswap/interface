import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { getRelativeAge } from 'utilities/src/time/relativeAge'
import { describe, expect, it } from 'vitest'

const NOW = Date.parse('2026-07-25T12:00:00Z')
const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('getRelativeAge', () => {
  it('floors elapsed time per unit', () => {
    expect(getRelativeAge(NOW - 42 * SECOND, NOW)).toEqual({ unit: 'seconds', value: 42 })
    expect(getRelativeAge(NOW - 5 * MINUTE, NOW)).toEqual({ unit: 'minutes', value: 5 })
    expect(getRelativeAge(NOW - 89 * MINUTE, NOW)).toEqual({ unit: 'hours', value: 1 })
    expect(getRelativeAge(NOW - 3 * HOUR, NOW)).toEqual({ unit: 'hours', value: 3 })
    expect(getRelativeAge(NOW - 49 * HOUR, NOW)).toEqual({ unit: 'days', value: 2 })
  })

  it('advances each unit at its boundary', () => {
    expect(getRelativeAge(NOW - 59_999, NOW)).toEqual({ unit: 'seconds', value: 59 })
    expect(getRelativeAge(NOW - MINUTE, NOW)).toEqual({ unit: 'minutes', value: 1 })
    expect(getRelativeAge(NOW - HOUR, NOW)).toEqual({ unit: 'hours', value: 1 })
    expect(getRelativeAge(NOW - DAY, NOW)).toEqual({ unit: 'days', value: 1 })
  })

  it('steps days → months at 30 days, with no week tier in between', () => {
    expect(getRelativeAge(NOW - 21 * DAY, NOW)).toEqual({ unit: 'days', value: 21 })
    expect(getRelativeAge(NOW - 29 * DAY, NOW)).toEqual({ unit: 'days', value: 29 })
    expect(getRelativeAge(NOW - 30 * DAY, NOW)).toEqual({ unit: 'months', value: 1 })
  })

  it('steps months → years at twelve 30-day months', () => {
    expect(getRelativeAge(NOW - 359 * DAY, NOW)).toEqual({ unit: 'months', value: 11 })
    expect(getRelativeAge(NOW - 360 * DAY, NOW)).toEqual({ unit: 'years', value: 1 })
    expect(getRelativeAge(NOW - 400 * DAY, NOW)).toEqual({ unit: 'years', value: 1 })
    expect(getRelativeAge(NOW - 730 * DAY, NOW)).toEqual({ unit: 'years', value: 2 })
  })

  it('clamps a future timestamp to 0 seconds, never a negative age', () => {
    expect(getRelativeAge(NOW + 5 * SECOND, NOW)).toEqual({ unit: 'seconds', value: 0 })
    expect(getRelativeAge(NOW + 3 * HOUR, NOW)).toEqual({ unit: 'seconds', value: 0 })
    expect(getRelativeAge(NOW, NOW)).toEqual({ unit: 'seconds', value: 0 })
  })

  it('returns undefined for non-finite input', () => {
    expect(getRelativeAge(Number.NaN, NOW)).toBeUndefined()
    expect(getRelativeAge(NOW, Number.NaN)).toBeUndefined()
    expect(getRelativeAge(Number.NEGATIVE_INFINITY, NOW)).toBeUndefined()
  })
})

// Pools imports these modules, and its strict typecheck follows type-only imports too: walk them
// and fail if any reach a module outside the light set or a package other than react.
describe('import graph', () => {
  const pkgRoot = resolve(__dirname, '../..')
  const IMPORT = /^(?:import|export)\s+[^'"]*?from\s+'([^']+)'/gm

  function resolveSource(specifier: string, fromFile: string): string {
    const base = specifier.startsWith('utilities/')
      ? join(pkgRoot, specifier.slice('utilities/'.length))
      : join(dirname(fromFile), specifier)
    for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) {
      try {
        readFileSync(candidate)
        return candidate
      } catch {
        // try the next extension
      }
    }
    throw new Error(`cannot resolve ${specifier} from ${fromFile}`)
  }

  function importClosure(entry: string): { files: Set<string>; external: Set<string> } {
    const files = new Set<string>()
    const external = new Set<string>()
    const visit = (file: string): void => {
      if (files.has(file)) {
        return
      }
      files.add(file)
      for (const match of readFileSync(file, 'utf8').matchAll(IMPORT)) {
        const specifier = match[1] ?? ''
        if (specifier.startsWith('utilities/') || specifier.startsWith('.')) {
          visit(resolveSource(specifier, file))
        } else {
          external.add(specifier)
        }
      }
    }
    visit(entry)
    return { files, external }
  }

  const relative = (files: Set<string>): string[] => [...files].map((file) => file.slice(pkgRoot.length + 1)).sort()

  it('keeps relativeAge free of every import', () => {
    const { files, external } = importClosure(join(__dirname, 'relativeAge.ts'))
    expect([...external]).toEqual([])
    expect(relative(files)).toEqual(['src/time/relativeAge.ts'])
  })

  it('keeps useNowMs down to react', () => {
    const { files, external } = importClosure(join(__dirname, 'useNowMs.ts'))
    expect([...external]).toEqual(['react'])
    expect(relative(files)).toEqual(['src/time/useNowMs.ts'])
  })
})
