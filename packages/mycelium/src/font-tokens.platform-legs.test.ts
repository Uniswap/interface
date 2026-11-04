/**
 * Platform-leg contract for the `fonts` token table, following
 * `input-compat/platform-legs.test.ts`.
 *
 * `moduleSuffixes` is configured nowhere in the repo, so `tsc` only resolves
 * the BASE leg: a `.native` leg can export a different symbol set or type and
 * nothing notices. Base ≡ web is structural (the base re-exports the web leg);
 * base ≡ native is what this suite proves — runtime keys only, not the type
 * half, which would need `export-type-parity.test.ts`'s tsc probe.
 *
 * It also pins the value columns, calling `nativeFontsTable` with an explicit
 * environment because this config resolves `.web.*` first — so
 * `nativeFontEnvironment()` would only ever return the web-equivalent column.
 * That makes this a shape-and-assembly guard; the native ramp values are
 * pinned in `text-compat/native-font.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import * as native from './font-tokens.native'
// Explicit .ts extension: this config resolves `.web.*` first, which would
// swap the base leg for the web leg here.
import * as base from './font-tokens.ts'
import { type FontVariantName, fonts as webFonts } from './font-tokens.web'
import { nativeFontsTable } from './native-fonts-table'
import { nativeVariantFont } from './text-compat/native-font'

/** `satisfies` proves each name is real; the first test proves completeness. */
const VARIANTS = [
  'heading1',
  'heading2',
  'heading3',
  'subheading1',
  'subheading2',
  'body1',
  'body2',
  'body3',
  'body4',
  'body5',
  'buttonLabel1',
  'buttonLabel2',
  'buttonLabel3',
  'buttonLabel4',
  'monospace',
] as const satisfies readonly FontVariantName[]

/**
 * The variants whose line-height ui writes as a FIXED px value, which the ramp
 * must leave alone. A blanket "+1 everywhere" would still look correct in the
 * `smallFont: true` column and break 11 of 15 variants on device.
 */
const FIXED_LINE_HEIGHT_VARIANTS: readonly FontVariantName[] = [
  'heading1',
  'heading2',
  'heading3',
  'subheading1',
  'subheading2',
  'body1',
  'body2',
  'body3',
  'body4',
  'body5',
  'monospace',
]

/** `fontFamilyByPlatform` — iOS names the embedded family, Android the file. */
const FAMILY: Readonly<Record<'ios' | 'android', Readonly<Record<'book' | 'medium' | 'mono', string>>>> = {
  ios: { book: 'Basel Grotesk', medium: 'Basel Grotesk', mono: 'InputMono-Regular' },
  android: { book: 'Basel-Grotesk-Book', medium: 'Basel-Grotesk-Medium', mono: 'InputMono-Regular' },
}

/** Which family key each variant renders, from ui's `platformFontFamily(...)` calls. */
const FAMILY_KEY: Readonly<Record<FontVariantName, 'book' | 'medium' | 'mono'>> = {
  heading1: 'book',
  heading2: 'book',
  heading3: 'book',
  subheading1: 'book',
  subheading2: 'book',
  body1: 'book',
  body2: 'book',
  body3: 'book',
  body4: 'book',
  body5: 'book',
  buttonLabel1: 'medium',
  buttonLabel2: 'medium',
  buttonLabel3: 'medium',
  buttonLabel4: 'medium',
  monospace: 'mono',
}

const PLATFORMS = ['ios', 'android'] as const
const SMALL_FONT_COLUMNS = [false, true]

describe('base leg re-exports the web leg', () => {
  it('fonts', () => {
    expect(base.fonts).toBe(webFonts)
  })
})

describe('export parity across the legs', () => {
  it('the native leg exports exactly the base leg symbol set', () => {
    expect(Object.keys(native).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(native)).toContain('fonts')
  })

  it('the native leg is NOT the web leg (a real split, not an accidental alias)', () => {
    expect(native.fonts).not.toBe(webFonts)
  })

  it('covers every variant the table carries', () => {
    expect([...VARIANTS]).toEqual(Object.keys(webFonts))
  })

  it('every leg carries the same variants, in the same order', () => {
    expect(Object.keys(native.fonts)).toEqual(Object.keys(webFonts))
  })

  it.each(VARIANTS)('%s carries the same members in every leg', (variant) => {
    expect(Object.keys(native.fonts[variant]).sort()).toEqual(Object.keys(webFonts[variant]).sort())
  })
})

describe('native table — non-CJK column (smallFont: false), where the ramp is visible', () => {
  const table = nativeFontsTable({ platform: 'ios', smallFont: false })

  // The ramp values themselves are pinned in text-compat/native-font.test.ts.
  it.each(VARIANTS)('%s carries the text-compat native ramp', (variant) => {
    const ramp = nativeVariantFont({ variant, smallFont: false })
    expect({ fontSize: table[variant].fontSize, lineHeight: table[variant].lineHeight }).toEqual({
      fontSize: ramp.fontSize,
      lineHeight: ramp.lineHeight,
    })
  })

  it.each(FIXED_LINE_HEIGHT_VARIANTS)('%s keeps its FIXED web line-height while the size gains +1', (variant) => {
    expect(table[variant].lineHeight).toBe(webFonts[variant].lineHeight)
    expect(table[variant].fontSize).toBe(webFonts[variant].fontSize + 1)
  })
})

describe('native table — CJK column (smallFont: true), the identity ramp', () => {
  const table = nativeFontsTable({ platform: 'ios', smallFont: true })

  it.each(VARIANTS)('%s equals the web metrics (adjustedSize is the identity)', (variant) => {
    expect(table[variant].fontSize).toBe(webFonts[variant].fontSize)
    expect(table[variant].lineHeight).toBe(webFonts[variant].lineHeight)
  })
})

describe('platform font naming', () => {
  it.each(PLATFORMS)('%s names the real RN family, never a Tamagui key', (platform) => {
    for (const smallFont of SMALL_FONT_COLUMNS) {
      const table = nativeFontsTable({ platform, smallFont })
      for (const variant of VARIANTS) {
        expect(table[variant].family, `${platform}/${variant} (smallFont: ${smallFont})`).toBe(
          FAMILY[platform][FAMILY_KEY[variant]],
        )
      }
    }
  })
})

describe('members ui does NOT diverge on are carried through, never re-derived', () => {
  it.each(PLATFORMS)('%s keeps web fontWeight, maxFontSizeMultiplier and letterSpacing', (platform) => {
    for (const smallFont of SMALL_FONT_COLUMNS) {
      const table = nativeFontsTable({ platform, smallFont })
      for (const variant of VARIANTS) {
        const label = `${platform}/${variant} (smallFont: ${smallFont})`
        expect(table[variant].fontWeight, `${label} fontWeight`).toBe(webFonts[variant].fontWeight)
        expect(table[variant].maxFontSizeMultiplier, `${label} maxFontSizeMultiplier`).toBe(
          webFonts[variant].maxFontSizeMultiplier,
        )
        expect(table[variant].letterSpacing, `${label} letterSpacing`).toBe(webFonts[variant].letterSpacing)
      }
    }
  })

  it('monospace still has no fontWeight member, as in ui', () => {
    expect('fontWeight' in nativeFontsTable({ platform: 'ios', smallFont: false }).monospace).toBe(false)
  })
})
