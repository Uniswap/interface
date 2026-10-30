/**
 * Locale pins for ButtonCompat's NATIVE size tables (INFRA-3297). Same
 * module-reset-and-remock discipline as
 * text-compat/needs-small-font.test.ts — see that file for the mock rationale.
 *
 * Default-locale values are pinned as literals rather than re-derived: they
 * are the pre-INFRA-3297 tables byte-for-byte, so this proves the locale gate
 * changed nothing for non-CJK devices (re-deriving them from the same formula
 * the tables use could reproduce a shared bug rather than catch one).
 */
import type { DeviceLocale } from 'utilities/src/device/constants'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.hoisted(() => ({ locales: [] as { languageCode: string | null; languageTag: string }[] }))

vi.mock('utilities/src/device/locales', () => ({
  getDeviceLocales: (): DeviceLocale[] => mockState.locales,
}))

// The tables import needs-small-font extensionless; under this jsdom config
// that resolves to the constant-true web stub, which would pin every case to
// the CJK column regardless of locale.
vi.mock('../text-compat/needs-small-font', () => import('../text-compat/needs-small-font.native'))

function setDeviceLanguage(languageCode: string): void {
  mockState.locales = [{ languageCode, languageTag: languageCode }]
}

async function importTablesForLocale(languageCode: string): Promise<typeof import('./native-size-tables')> {
  setDeviceLanguage(languageCode)
  vi.resetModules()
  return import('./native-size-tables')
}

const DEFAULT_TEXT_SIZE = {
  xxsmall: 'text-[13px] leading-[14.95px]',
  xsmall: 'text-[13px] leading-[17.25px]',
  small: 'text-[15px] leading-[17.25px]',
  medium: 'text-[17px] leading-[21.85px]',
  large: 'text-[19px] leading-[21.85px]',
}

const DEFAULT_TEXT_SIZE_NO_LEADING = {
  xxsmall: 'text-[13px]',
  xsmall: 'text-[13px]',
  small: 'text-[15px]',
  medium: 'text-[17px]',
  large: 'text-[19px]',
}

const DEFAULT_ICON_SIZE_PX = {
  xxsmall: 14.95,
  xsmall: 17.25,
  small: 17.25,
  medium: 21.85,
  large: 21.85,
}

const CJK_TEXT_SIZE = {
  xxsmall: 'text-[12px] leading-[13.8px]',
  xsmall: 'text-[12px] leading-[16.1px]',
  small: 'text-[14px] leading-[16.1px]',
  medium: 'text-[16px] leading-[20.7px]',
  large: 'text-[18px] leading-[20.7px]',
}

const CJK_TEXT_SIZE_NO_LEADING = {
  xxsmall: 'text-[12px]',
  xsmall: 'text-[12px]',
  small: 'text-[14px]',
  medium: 'text-[16px]',
  large: 'text-[18px]',
}

const CJK_ICON_SIZE_PX = {
  xxsmall: 13.8,
  xsmall: 16.1,
  small: 16.1,
  medium: 20.7,
  large: 20.7,
}

beforeEach(() => {
  vi.resetModules()
})

describe('NATIVE size tables per device locale (INFRA-3297)', () => {
  it('default locale keeps the pre-INFRA-3297 tables byte-for-byte (fontSize f+1, box (l+1)*1.15)', async () => {
    const tables = await importTablesForLocale('en')
    expect(tables.NATIVE_TEXT_SIZE).toEqual(DEFAULT_TEXT_SIZE)
    expect(tables.NATIVE_TEXT_SIZE_NO_LEADING).toEqual(DEFAULT_TEXT_SIZE_NO_LEADING)
    expect(tables.NATIVE_ICON_SIZE_PX).toEqual(DEFAULT_ICON_SIZE_PX)
    expect(tables.NATIVE_SPINNER_SIZE).toBe(tables.NATIVE_ICON_SIZE_PX)
  })

  it.each(['zh', 'ja'])(
    '%s locale skips the +1px bump, matching legacy adjustedSize (fontSize f, box l*1.15)',
    async (languageCode) => {
      const tables = await importTablesForLocale(languageCode)
      expect(tables.NATIVE_TEXT_SIZE).toEqual(CJK_TEXT_SIZE)
      expect(tables.NATIVE_TEXT_SIZE_NO_LEADING).toEqual(CJK_TEXT_SIZE_NO_LEADING)
      expect(tables.NATIVE_ICON_SIZE_PX).toEqual(CJK_ICON_SIZE_PX)
      expect(tables.NATIVE_SPINNER_SIZE).toBe(tables.NATIVE_ICON_SIZE_PX)
    },
  )

  it('the CJK column equals the web ramp by construction (adjustedSize is the identity in both)', async () => {
    const tables = await importTablesForLocale('zh')
    const compile = await import('./compile')
    // The web icon table is compile.ts's `ICON_SIZE_PX` export; the web TEXT
    // tables are module-private (byte-pinned by web-class-pin.test.tsx), so
    // this reads them via compile.ts's test-only re-exports instead of a
    // second hand-pinned literal, so a future change to the web ramp can't
    // leave this column silently stale.
    expect(tables.NATIVE_ICON_SIZE_PX).toEqual(compile.ICON_SIZE_PX)
    expect(tables.NATIVE_TEXT_SIZE).toEqual(compile.__testOnlyTextSize)
    expect(tables.NATIVE_TEXT_SIZE_NO_LEADING).toEqual(compile.__testOnlyTextSizeNoLeading)
  })
})

describe('compile.ts wiring: the gate reaches the emitted classes and the re-exports', () => {
  const ctx = {
    variant: 'default',
    emphasis: 'primary',
    isDisabled: false,
  } as const

  it('zh: label classes and icon/spinner boxes carry the CJK column', async () => {
    setDeviceLanguage('zh')
    vi.resetModules()
    const compile = await import('./compile')
    expect(compile.buttonCompatNativeTextClassName({ ...ctx, size: 'medium' })).toContain(CJK_TEXT_SIZE.medium)
    const zhLargeNoLeading = compile.buttonCompatNativeTextClassName({
      ...ctx,
      size: 'large',
      lineHeightDisabled: true,
    })
    expect(zhLargeNoLeading).toContain(CJK_TEXT_SIZE_NO_LEADING.large)
    // CJK_TEXT_SIZE_NO_LEADING.large ('text-[18px]') is a substring of
    // CJK_TEXT_SIZE.large ('text-[18px] leading-[20.7px]'), so the toContain
    // above alone would pass even if lineHeightDisabled were wired to a no-op.
    expect(zhLargeNoLeading).not.toContain('leading-')
    expect(compile.NATIVE_ICON_SIZE_PX).toEqual(CJK_ICON_SIZE_PX)
    expect(compile.NATIVE_SPINNER_SIZE).toEqual(CJK_ICON_SIZE_PX)
  })

  it('en: label classes and icon/spinner boxes carry the default column, unchanged', async () => {
    setDeviceLanguage('en')
    vi.resetModules()
    const compile = await import('./compile')
    expect(compile.buttonCompatNativeTextClassName({ ...ctx, size: 'medium' })).toContain(DEFAULT_TEXT_SIZE.medium)
    const enLargeNoLeading = compile.buttonCompatNativeTextClassName({
      ...ctx,
      size: 'large',
      lineHeightDisabled: true,
    })
    expect(enLargeNoLeading).toContain(DEFAULT_TEXT_SIZE_NO_LEADING.large)
    // Same substring-shadowing risk as the zh case above: DEFAULT_TEXT_SIZE_NO_LEADING.large
    // ('text-[19px]') is a substring of DEFAULT_TEXT_SIZE.large ('text-[19px] leading-[21.85px]').
    expect(enLargeNoLeading).not.toContain('leading-')
    expect(compile.NATIVE_ICON_SIZE_PX).toEqual(DEFAULT_ICON_SIZE_PX)
    expect(compile.NATIVE_SPINNER_SIZE).toEqual(DEFAULT_ICON_SIZE_PX)
  })
})
