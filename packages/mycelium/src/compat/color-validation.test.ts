/**
 * Contract tests for the ported color validators: `validColor` (INFRA-3601),
 * mirroring the legacy suite (`ui/src/theme/tokens.test.ts` — the
 * `validColor` describe) plus the prod/dev gating the legacy suite exercises
 * via the `isProdEnv` mock, and `getIsValidSporeColor` (INFRA-3545), whose
 * parity drift guard is documented above `LEGACY_ACCEPTED_COLOR_NAMES`.
 */
import { isProdEnv } from '@universe/environment'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_COLOR_NAMES } from '../theme-hooks-compat/theme-colors'
import { getIsValidSporeColor, validColor } from './color-validation'

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return { ...actual, isProdEnv: vi.fn(() => false) }
})

const mockIsProdEnv = vi.mocked(isProdEnv)

beforeEach(() => {
  mockIsProdEnv.mockReturnValue(false)
})

afterAll(() => {
  vi.restoreAllMocks()
})

/**
 * Parity drift guard against the legacy `getIsValidSporeColor`
 * (`ui/src/theme/tokens.ts`): the legacy check accepts a `$`-prefixed name
 * found in either the raw palette (`ui/src/theme/color/colors.ts` `colors`)
 * or the light theme (`ui/src/theme/themes.ts` `themes.light`). The list
 * below is that union, transcribed from the legacy sources — deliberately
 * independent literals, never derived from the mycelium generated names, so
 * either side drifting fails this file loudly (the INFRA-3461
 * replicated-constants pattern; mycelium must never import `packages/ui`).
 */
const LEGACY_ACCEPTED_COLOR_NAMES: readonly string[] = [
  'DEP_accentBranded',
  'DEP_accentSoft',
  'DEP_backgroundBranded',
  'DEP_backgroundOverlay',
  'DEP_blue400',
  'DEP_brandedAccentSoft',
  'DEP_fiatBanner',
  'DEP_magentaDark',
  'DEP_shadowBranded',
  'accent1',
  'accent1Hovered',
  'accent2',
  'accent2Hovered',
  'accent2Solid',
  'accent3',
  'accent3Hovered',
  'background',
  'backgroundFocus',
  'backgroundHover',
  'backgroundPress',
  'black',
  'blueBase',
  'blueDark',
  'blueLight',
  'bluePastel',
  'blueVibrant',
  'borderColor',
  'borderColorFocus',
  'borderColorHover',
  'brownBase',
  'brownDark',
  'brownLight',
  'brownPastel',
  'brownVibrant',
  'chain_1',
  'chain_10',
  'chain_10143',
  'chain_11155111',
  'chain_130',
  'chain_1301',
  'chain_137',
  'chain_143',
  'chain_1868',
  'chain_196',
  'chain_324',
  'chain_42161',
  'chain_4217',
  'chain_42220',
  'chain_43114',
  'chain_4326',
  'chain_4663',
  'chain_480',
  'chain_501000101',
  'chain_5042',
  'chain_56',
  'chain_57073',
  'chain_59144',
  'chain_7777777',
  'chain_80001',
  'chain_8453',
  'chain_99901',
  'color',
  'colorFocus',
  'colorHover',
  'colorPress',
  'cyanBase',
  'cyanDark',
  'cyanLight',
  'cyanPastel',
  'cyanVibrant',
  'fiatOnRampBanner',
  'greenBase',
  'greenDark',
  'greenLight',
  'greenPastel',
  'greenVibrant',
  'limeBase',
  'limeDark',
  'limeLight',
  'limePastel',
  'limeVibrant',
  'neutral1',
  'neutral1Contrast',
  'neutral1Hovered',
  'neutral2',
  'neutral2Hovered',
  'neutral3',
  'neutral3Hovered',
  'orangeBase',
  'orangeDark',
  'orangeLight',
  'orangePastel',
  'orangeVibrant',
  'outlineColor',
  'pinkBase',
  'pinkDark',
  'pinkLight',
  'pinkPastel',
  'pinkThemed',
  'pinkVibrant',
  'poolsBrandGreen',
  'purpleBase',
  'purpleDark',
  'purpleLight',
  'purplePastel',
  'purpleVibrant',
  'redBase',
  'redDark',
  'redLight',
  'redPastel',
  'redVibrant',
  'scrim',
  'shadowColor',
  'shadowColorHover',
  'statusCritical',
  'statusCritical2',
  'statusCritical2Hovered',
  'statusCriticalHovered',
  'statusSuccess',
  'statusSuccess2',
  'statusSuccess2Hovered',
  'statusSuccessHovered',
  'statusWarning',
  'statusWarning2',
  'statusWarning2Hovered',
  'statusWarningHovered',
  'surface1',
  'surface1Contrast',
  'surface1Hovered',
  'surface2',
  'surface2Hovered',
  'surface3',
  'surface3Contrast',
  'surface3Hovered',
  'surface3Solid',
  'surface4',
  'surface5',
  'surface5Hovered',
  'transparent',
  'turquoiseBase',
  'turquoiseDark',
  'turquoiseLight',
  'turquoisePastel',
  'turquoiseVibrant',
  'uniswapXPurple',
  'uniswapXViolet',
  'white',
  'yellowBase',
  'yellowDark',
  'yellowLight',
  'yellowPastel',
  'yellowVibrant',
]

describe('getIsValidSporeColor', () => {
  it('accepts every $-prefixed name the legacy validator accepts (full enumeration)', () => {
    const rejected = LEGACY_ACCEPTED_COLOR_NAMES.filter((name) => !getIsValidSporeColor(`$${name}`))
    expect(rejected).toEqual([])
  })

  it('enumerates the full legacy union (count pin against silent truncation)', () => {
    expect(LEGACY_ACCEPTED_COLOR_NAMES).toHaveLength(152)
  })

  it('accepts nothing beyond the legacy union (set-size pin — subset check plus equal size means set equality)', () => {
    // The full-enumeration test above proves legacy ⊆ generated only; this
    // pins the generated set's size to the legacy list's, so a silently
    // widened validator fails here instead of passing unnoticed.
    expect(new Set(THEME_COLOR_NAMES).size).toBe(LEGACY_ACCEPTED_COLOR_NAMES.length)
  })

  it.each(['pinkVibrant', 'greenBase', 'uniswapXPurple', 'fiatOnRampBanner'])(
    'accepts palette-only names the theme does not re-key (%s)',
    (name) => {
      expect(getIsValidSporeColor(`$${name}`)).toBe(true)
    },
  )

  it.each(['accent1', 'neutral2Hovered', 'statusCritical', 'transparent', 'chain_130', 'poolsBrandGreen'])(
    'accepts theme-only names absent from the raw palette (%s)',
    (name) => {
      expect(getIsValidSporeColor(`$${name}`)).toBe(true)
    },
  )

  it('rejects un-prefixed names, raw CSS colors, and unknown tokens (legacy contract)', () => {
    expect(getIsValidSporeColor('neutral1')).toBe(false)
    expect(getIsValidSporeColor('#FF5F52')).toBe(false)
    expect(getIsValidSporeColor('rgba(0,0,0,0.5)')).toBe(false)
    expect(getIsValidSporeColor('$notARealToken')).toBe(false)
    expect(getIsValidSporeColor('$')).toBe(false)
    expect(getIsValidSporeColor('')).toBe(false)
  })

  it('rejects Object prototype names (deliberate divergence from the legacy in-operator lookup)', () => {
    // The legacy check walks the prototype chain, so '$toString' slips
    // through it; the Set lookup here rejects it. No real token is affected —
    // call sites pass ColorTokens.
    expect(getIsValidSporeColor('$toString')).toBe(false)
    expect(getIsValidSporeColor('$hasOwnProperty')).toBe(false)
  })
})

describe('validColor', () => {
  it('passes token-format values through', () => {
    expect(validColor('$neutral1')).toBe('$neutral1')
    expect(validColor('$accent1')).toBe('$accent1')
  })

  it('passes CSS color values through', () => {
    expect(validColor('#FFFFFF')).toBe('#FFFFFF')
    expect(validColor('rgb(255, 255, 255)')).toBe('rgb(255, 255, 255)')
    expect(validColor('rgba(255, 255, 255, 0.5)')).toBe('rgba(255, 255, 255, 0.5)')
    expect(validColor('hsl(120, 50%, 50%)')).toBe('hsl(120, 50%, 50%)')
    expect(validColor('hsla(120, 50%, 50%, 0.5)')).toBe('hsla(120, 50%, 50%, 0.5)')
    expect(validColor('var(--some-color)')).toBe('var(--some-color)')
  })

  it('returns undefined for nullish values', () => {
    expect(validColor(undefined)).toBeUndefined()
    expect(validColor(null)).toBeUndefined()
  })

  it('throws outside production for values that cannot be colors', () => {
    expect(() => validColor('not-a-color')).toThrow('Invalid color value')
    expect(() => validColor('123456')).toThrow('Invalid color value')
    // The legacy rough check runs before the falsy return, so the empty
    // string throws too — ported faithfully.
    expect(() => validColor('')).toThrow('Invalid color value')
  })

  it('does not throw in production, passing the value through', () => {
    mockIsProdEnv.mockReturnValue(true)
    expect(validColor('not-a-color')).toBe('not-a-color')
  })
})
