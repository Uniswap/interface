/**
 * Platform-leg contract for the TouchableTextLink compat (INFRA-3487),
 * following `modal-close-icon/platform-legs.test.ts`.
 *
 * Why this has to exist: `moduleSuffixes` is configured nowhere in the repo, so
 * `tsc` only ever resolves the BASE leg — a `.native` leg cannot carry a
 * different type, and nothing in the typechecker notices if it exports a
 * different symbol set. A bundler that resolved the native leg would then hit a
 * missing export at runtime. The base leg is a 1-line re-export of the web leg
 * (the `TouchableAreaCompat.tsx` mechanism), so base ≡ web is a structural
 * given; base ≡ native is what this suite proves.
 */
import { describe, expect, it, vi } from 'vitest'
// Explicit .tsx extension: this vitest config resolves `.web.*` first, which
// would silently swap the platformless base leg for the web leg here.
import * as base from './TouchableTextLinkCompat.tsx'
import * as web from './TouchableTextLinkCompat.web'

// The native leg imports react-native (Flow sources this jsdom config cannot
// parse); the mock supplies the hosts plus Linking.
vi.mock('react-native', () => import('./testing/react-native-mock'))

describe('base leg re-exports the web leg', () => {
  it('TouchableTextLinkCompat', () => {
    expect(base.TouchableTextLinkCompat).toBe(web.TouchableTextLinkCompat)
  })
})

describe('export parity across the legs', () => {
  it('the native leg exports exactly the base leg symbol set', async () => {
    const native = await import('./TouchableTextLinkCompat.native')
    expect(Object.keys(native).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(native)).toContain('TouchableTextLinkCompat')
  })

  it('both legs are real components, not stubs', async () => {
    const native = await import('./TouchableTextLinkCompat.native')
    for (const leg of [web.TouchableTextLinkCompat, native.TouchableTextLinkCompat]) {
      expect(typeof leg).toBe('object') // forwardRef exotic component
      expect(leg).toHaveProperty('render')
    }
  })

  it('the native leg is NOT the web leg (a real split, not an accidental alias)', async () => {
    const native = await import('./TouchableTextLinkCompat.native')
    expect(native.TouchableTextLinkCompat).not.toBe(web.TouchableTextLinkCompat)
  })
})
