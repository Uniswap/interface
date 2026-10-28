/**
 * The smallFont gate on the native style lane: CJK locales skip the +1px
 * `adjustedSize` bump, and `native-font-environment.native.ts` reads the gate
 * once at module init.
 *
 * The `.native` legs are imported explicitly — the jsdom config resolves
 * `.web` first, and the web leg is constant-true.
 */
import type { DeviceLocale } from 'utilities/src/device/constants'
import { describe, expect, it, vi } from 'vitest'
import { needsSmallFont } from './needs-small-font.native'

const mockState = vi.hoisted(() => ({ locales: [] as { languageCode: string | null; languageTag: string }[] }))

vi.mock('utilities/src/device/locales', () => ({
  getDeviceLocales: (): DeviceLocale[] => mockState.locales,
}))

// native-font-environment.native's extensionless needs-small-font import would
// otherwise resolve to the constant-true web leg under this jsdom config.
vi.mock('./needs-small-font', () => import('./needs-small-font.native'))
vi.mock('react-native', () => import('../compat/testing/react-native-mock'))

function setDeviceLanguage(languageCode: string | null): void {
  mockState.locales = [{ languageCode, languageTag: languageCode ?? 'und' }]
}

describe('needsSmallFont (native)', () => {
  it('is true only for Chinese and Japanese', () => {
    setDeviceLanguage('zh')
    expect(needsSmallFont()).toBe(true)
    setDeviceLanguage('ja')
    expect(needsSmallFont()).toBe(true)
    setDeviceLanguage('zh-Hant')
    expect(needsSmallFont()).toBe(false)
    setDeviceLanguage('en')
    expect(needsSmallFont()).toBe(false)
    setDeviceLanguage(null)
    expect(needsSmallFont()).toBe(false)
  })

  it('is false when the device reports no locales', () => {
    mockState.locales = []
    expect(needsSmallFont()).toBe(false)
  })
})

describe('native-font-environment wiring', () => {
  it('smallFont carries needsSmallFont, evaluated at module init', async () => {
    setDeviceLanguage('ja')
    vi.resetModules()
    const jaEnv = (await import('./native-font-environment.native')).nativeFontEnvironment()
    expect(jaEnv.smallFont).toBe(true)

    setDeviceLanguage('en')
    vi.resetModules()
    const enEnv = (await import('./native-font-environment.native')).nativeFontEnvironment()
    expect(enEnv.smallFont).toBe(false)
  })
})
