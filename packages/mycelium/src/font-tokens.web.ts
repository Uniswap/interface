/**
 * Web leg of the `fonts` token table: the legacy font variants over the
 * `@universe/tailwind` ui-parity `fonts` tokens (`--typography-*`) — not the
 * re-cut `--text-*` web scale, whose reconciliation with ui stays a separate
 * effort (#35388).
 *
 * Derived from `@universe/tailwind`, never from copied ui literals. The native
 * column cannot be derived there (CSS has no native branch), so it resolves in
 * ./font-tokens.native.ts.
 */
import { type FontToken, fonts as tailwindFonts } from '@universe/tailwind'

/**
 * One variant of the platform-resolved table: `@universe/tailwind`'s
 * `FontToken` with `family` widened to whatever each platform resolves — web
 * keeps the legacy Tamagui key, native names the real RN family — the same
 * widening `ui/src/theme`'s own `fonts` declares.
 *
 * tsc only resolves the base leg, so a narrow `family` union here would
 * type-lie about every native value. `family` is also the one member whose
 * divergence is silent on device: a Tamagui key in an RN `fontFamily` neither
 * errors nor crashes, it just renders the system font.
 */
export interface ResolvedFontToken extends Omit<FontToken, 'family'> {
  family: string
}

const table = {
  heading1: tailwindFonts['heading-1'],
  heading2: tailwindFonts['heading-2'],
  heading3: tailwindFonts['heading-3'],
  subheading1: tailwindFonts['subheading-1'],
  subheading2: tailwindFonts['subheading-2'],
  body1: tailwindFonts['body-1'],
  body2: tailwindFonts['body-2'],
  body3: tailwindFonts['body-3'],
  body4: tailwindFonts['body-4'],
  body5: tailwindFonts['body-5'],
  buttonLabel1: tailwindFonts['button-label-1'],
  buttonLabel2: tailwindFonts['button-label-2'],
  buttonLabel3: tailwindFonts['button-label-3'],
  buttonLabel4: tailwindFonts['button-label-4'],
  monospace: tailwindFonts.monospace,
} satisfies Record<string, ResolvedFontToken>

/** Legacy font variant names (`heading1`, `body2`, …). */
export type FontVariantName = keyof typeof table

export const fonts: Readonly<Record<FontVariantName, ResolvedFontToken>> = table
