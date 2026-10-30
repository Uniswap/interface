/**
 * Platform-leg contract for the ElementAfterText compat (INFRA-3601),
 * following `anchor-compat/platform-legs.test.ts`.
 *
 * Why this has to exist: `moduleSuffixes` is configured nowhere in the repo, so
 * `tsc` only ever resolves the BASE leg — a `.native` leg cannot carry a
 * different type, and nothing in the typechecker notices if it exports a
 * different symbol set. A bundler that resolved the native leg would then hit a
 * missing export at runtime. The base leg is a 1-line re-export of the web leg
 * (the `TouchableAreaCompat.tsx` mechanism), so base ≡ web is a structural
 * given; base ≡ native is what this suite proves.
 */
import { describe, expect, it } from 'vitest'
// Explicit .tsx extension: this vitest config resolves `.web.*` first, which
// would silently swap the platformless base leg for the web leg here.
import * as base from './ElementAfterTextCompat.tsx'
import * as web from './ElementAfterTextCompat.web'

describe('base leg re-exports the web leg', () => {
  it('ElementAfterTextCompat', () => {
    expect(base.ElementAfterTextCompat).toBe(web.ElementAfterTextCompat)
  })
})

describe('export parity across the legs', () => {
  it('the native leg exports exactly the base leg symbol set', async () => {
    const native = await import('./ElementAfterTextCompat.native')
    expect(Object.keys(native).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(native)).toContain('ElementAfterTextCompat')
  })

  it('both legs are real components, not stubs', async () => {
    const native = await import('./ElementAfterTextCompat.native')
    for (const leg of [web.ElementAfterTextCompat, native.ElementAfterTextCompat]) {
      expect(typeof leg).toBe('function')
    }
  })

  it('the native leg is NOT the web leg (a real split, not an accidental alias)', async () => {
    const native = await import('./ElementAfterTextCompat.native')
    expect(native.ElementAfterTextCompat).not.toBe(web.ElementAfterTextCompat)
  })
})
