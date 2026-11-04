/**
 * Platform-leg contract for the IconButton compat, following
 * `spinning-loader-compat/platform-legs.test.ts`.
 *
 * Why this has to exist: `moduleSuffixes` is configured nowhere in the repo, so
 * `tsc` only ever resolves the BASE leg — a `.native` leg cannot carry a
 * different type, and nothing in the typechecker notices if it exports a
 * different symbol set. A bundler that resolved the native leg would then hit a
 * missing export at runtime. The base leg is a 1-line re-export of the web leg,
 * so base ≡ web is a structural given; base ≡ native is what this suite proves.
 */
import { describe, expect, it, vi } from 'vitest'
// Explicit .tsx extension: this vitest config resolves `.web.*` first, which
// would silently swap the platformless base leg for the web leg here.
import * as base from './IconButtonCompat.tsx'
import * as web from './IconButtonCompat.web'

// The native leg's dependency closure resolves untranspiled RN-flavored
// sources under this jsdom config — serve the button-compat stand-ins instead
// (the spinning-loader-compat precedent). The real modules only run on device.
vi.mock('react-native', () => import('../button-compat/testing/native-mocks'))
vi.mock('react-native-gesture-handler', () => import('../button-compat/testing/gesture-handler-mock'))
vi.mock('react-native-reanimated', () => import('../button-compat/testing/reanimated-mock'))
vi.mock('react-native-svg', () => import('../button-compat/testing/react-native-svg-mock'))
vi.mock('uniwind', () => import('../button-compat/testing/uniwind-mock'))

describe('base leg re-exports the web leg', () => {
  it('IconButtonCompat', () => {
    expect(base.IconButtonCompat).toBe(web.IconButtonCompat)
  })
})

describe('export parity across the legs', () => {
  it('the native leg exports exactly the base leg symbol set', async () => {
    const native = await import('./IconButtonCompat.native')
    expect(Object.keys(native).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(native)).toContain('IconButtonCompat')
  })

  it('both legs are real forwardRef components, not stubs', async () => {
    const native = await import('./IconButtonCompat.native')
    for (const leg of [web.IconButtonCompat, native.IconButtonCompat]) {
      expect((leg as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.forward_ref'))
    }
  })

  it('the native leg is NOT the web leg (a real split, not an accidental alias)', async () => {
    const native = await import('./IconButtonCompat.native')
    expect(native.IconButtonCompat).not.toBe(web.IconButtonCompat)
  })
})
