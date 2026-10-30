import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// The point of this package is that both apps can import it without Apollo (the @universe/api
// barrel), ethers (or @universe/chains, which pulls it), react-native, redux or i18n. Walk the
// runtime imports reachable from the public entry (type-only imports are erased) and fail if any
// reach a module outside the light set.
describe('import graph', () => {
  const srcRoot = resolve(__dirname)
  const RUNTIME_IMPORT = /^(?:import|export)\s+(?!type\b)[^'"]*?from\s+'([^']+)'/gm

  function resolveSource(specifier: string, fromFile: string): string {
    const base = join(dirname(fromFile), specifier)
    for (const candidate of [`${base}.ts`, join(base, 'index.ts')]) {
      try {
        readFileSync(candidate)
        return candidate
      } catch {
        // try the next candidate
      }
    }
    throw new Error(`cannot resolve ${specifier} from ${fromFile}`)
  }

  function runtimeClosure(entry: string): { files: Set<string>; external: Set<string> } {
    const files = new Set<string>()
    const external = new Set<string>()
    const visit = (file: string): void => {
      if (files.has(file)) {
        return
      }
      files.add(file)
      for (const match of readFileSync(file, 'utf8').matchAll(RUNTIME_IMPORT)) {
        const specifier = match[1] ?? ''
        if (specifier.startsWith('.')) {
          visit(resolveSource(specifier, file))
        } else {
          external.add(specifier)
        }
      }
    }
    visit(entry)
    return { files, external }
  }

  it('reaches no external package but viem, and only its own source', () => {
    const { files, external } = runtimeClosure(join(srcRoot, 'index.ts'))

    expect([...external]).toEqual(['viem'])
    expect([...files].map((file) => file.slice(srcRoot.length + 1)).sort()).toEqual([
      'bid/cappedMaxBid.ts',
      'bid/quickLaunchMaxBidFdv.ts',
      'bid/ticks.ts',
      'index.ts',
      'settle/exitAndClaim.ts',
      'settle/settleCalldata.ts',
    ])
  })

  // The walk must actually see imports, or the assertion above passes on an empty closure.
  it('detects a runtime import and ignores a type-only one', () => {
    const sample = [
      "import { a } from 'heavy-runtime'",
      "import type { B } from 'types-only'",
      "export { c } from './c'",
    ]
    expect([...sample.join('\n').matchAll(RUNTIME_IMPORT)].map((match) => match[1])).toEqual(['heavy-runtime', './c'])
  })
})
