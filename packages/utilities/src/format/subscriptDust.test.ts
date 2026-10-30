import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { subscriptDust } from 'utilities/src/format/subscriptDust'
import { describe, expect, it } from 'vitest'

describe('subscriptDust', () => {
  it('renders 4+ leading zeros as subscript, up to 4 significant digits', () => {
    expect(subscriptDust(0.000012345)).toBe('0.0₄1234')
    expect(subscriptDust(0.00001024)).toBe('0.0₄1024')
    expect(subscriptDust(0.0000001234)).toBe('0.0₆1234')
    expect(subscriptDust(0.0000092)).toBe('0.0₅92')
  })

  it('keeps at least 2 significant digits', () => {
    expect(subscriptDust(0.00005)).toBe('0.0₄50')
    expect(subscriptDust(0.0000001)).toBe('0.0₆10')
  })

  it('handles multi-digit zero counts', () => {
    expect(subscriptDust(1e-12)).toBe('0.0₁₁10')
    expect(subscriptDust(1e-18)).toBe('0.0₁₇10')
  })

  it('reads the zero count after rounding, so a carry lands on the shorter count', () => {
    expect(subscriptDust(0.000099999)).toBeUndefined()
  })

  it('leaves values with fewer than 4 leading zeros to the caller', () => {
    expect(subscriptDust(0.00012345)).toBeUndefined()
    expect(subscriptDust(0.0042)).toBeUndefined()
    expect(subscriptDust(0.42)).toBeUndefined()
  })

  it('never subscripts values at or above 1', () => {
    expect(subscriptDust(1)).toBeUndefined()
    expect(subscriptDust(104)).toBeUndefined()
    expect(subscriptDust(1_000_000)).toBeUndefined()
  })

  it('refuses zero, negatives and non-finite input', () => {
    expect(subscriptDust(0)).toBeUndefined()
    expect(subscriptDust(-0.0000092)).toBeUndefined()
    expect(subscriptDust(Number.NaN)).toBeUndefined()
    expect(subscriptDust(Number.POSITIVE_INFINITY)).toBeUndefined()
  })
})

// Pools imports this module, and its strict typecheck follows type-only imports too: walk them all
// and fail if any reach an external package or a module outside the light set.
describe('import graph', () => {
  const pkgRoot = resolve(__dirname, '../../')
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

  it('reaches no external package and only the light modules, types included', () => {
    const { files, external } = importClosure(join(__dirname, 'subscriptDust.ts'))

    expect([...external]).toEqual([])
    expect([...files].map((file) => file.slice(pkgRoot.length + 1)).sort()).toEqual([
      'src/format/getSubscriptNotationParts.ts',
      'src/format/subscriptDust.ts',
      'src/format/toSubscript.ts',
    ])
  })
})
