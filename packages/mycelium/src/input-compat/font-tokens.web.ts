/**
 * Web leg of the Input compat font tables: the `$fontFamily` token → font
 * stack map and per-family `$size` → font-size scales the legacy engine
 * resolved Input typography against (transcribed from the legacy cascade,
 * `ui/src/theme/fonts.ts` web branch; variant metrics ride the shared
 * `@universe/tailwind` ui-parity `fonts` tokens via `../tokens`).
 */
import { isWebApp } from '@universe/environment'
import { fonts, WEB_BASEL_FONT_STACK } from '../tokens'

// The exact web monospace stack the legacy cascade emitted as an inline font-family value.
const MONOSPACE_STACK =
  'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Courier New", monospace'

export const fontFamilyTokens = {
  heading: WEB_BASEL_FONT_STACK,
  subHeading: WEB_BASEL_FONT_STACK,
  body: WEB_BASEL_FONT_STACK,
  button: WEB_BASEL_FONT_STACK,
  monospace: MONOSPACE_STACK,
}

export type FontFamilyKey = keyof typeof fontFamilyTokens

/** Per-family `$size` token → font-size scales (the legacy createFont size maps). */
export const fontSizeScales: Record<FontFamilyKey, Record<string, number>> = {
  heading: {
    small: fonts.heading3.fontSize,
    medium: fonts.heading2.fontSize,
    true: fonts.heading2.fontSize,
    large: fonts.heading1.fontSize,
  },
  subHeading: {
    small: fonts.subheading2.fontSize,
    large: fonts.subheading1.fontSize,
    true: fonts.subheading1.fontSize,
  },
  body: {
    nano: fonts.body5.fontSize,
    micro: fonts.body4.fontSize,
    small: fonts.body3.fontSize,
    medium: fonts.body2.fontSize,
    true: fonts.body2.fontSize,
    large: fonts.body1.fontSize,
  },
  button: {
    micro: fonts.buttonLabel4.fontSize,
    small: fonts.buttonLabel3.fontSize,
    medium: fonts.buttonLabel2.fontSize,
    large: fonts.buttonLabel1.fontSize,
    true: fonts.buttonLabel2.fontSize,
  },
  monospace: {
    micro: fonts.body4.fontSize,
    small: fonts.body3.fontSize,
    medium: fonts.body2.fontSize,
    large: fonts.body1.fontSize,
    true: fonts.body4.fontSize,
  },
}

/**
 * `$book`/`$medium`/`$true` weight tokens. Legacy gates the web-app 485/535
 * weights on `isWebApp` — the extension (web platform, different appId)
 * renders 400/500, and the compat reproduces that, not "web = 485".
 */
export const defaultWeights = {
  book: isWebApp ? '485' : '400',
  true: isWebApp ? '485' : '400',
  medium: isWebApp ? '535' : '500',
}

/** `$true` weight in a `$button` font context (the legacy BUTTON_MEDIUM_WEIGHT). */
export const BUTTON_MEDIUM_WEIGHT = '500'

/**
 * The default-frame typography (legacy body/$medium): fontSize from the shared
 * body2 token; px lineHeight is web-only — Tamagui's input size variant
 * deletes it on native, so the native leg pins `lineHeight: undefined`.
 */
export const defaultFrameFont: { fontSize: number; lineHeight: number | undefined } = {
  fontSize: fonts.body2.fontSize,
  lineHeight: fonts.body2.lineHeight,
}
