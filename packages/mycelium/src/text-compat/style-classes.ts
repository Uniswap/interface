/**
 * The Text binding of the shared per-style-object compiler: typography
 * (`typography-classes.ts`) + the shared flexbox surface + the universal
 * `commonStyleClasses` core, with the Text strategy plugged in — pinned
 * `--stext-*` color vars instead of semantic utilities (the Text color surface
 * covers the full legacy theme palette) and the Text-extended long tail.
 * Pool orchestration lives in `compile.ts`.
 */
import type { ClassList } from '../compat/style-classes'
import { type CommonStyleClassOptions, commonStyleClasses, flexboxStyleClasses } from '../compat/style-classes'
import type { TextCompatStyleProps } from './props'
import { LONG_TAIL_STYLE_PROPS, UNITLESS_STYLE_PROPS } from './style-props'
import { colorCssExpression, colorPropertyClass } from './tokens'
import { effectiveFontToken, typographyClasses } from './typography-classes'

export { effectiveFontToken }

const TEXT_STYLE_OPTIONS: CommonStyleClassOptions = {
  // Full-palette pinned vars: `[background-color:var(--stext-…)]` rather than
  // `bg-…` — the Text color surface exceeds the semantic utility set and pins
  // the legacy palette verbatim (no drift ledger needed).
  colorClasses: (prefix, value) => [colorPropertyClass(prefix === 'bg' ? 'background-color' : 'border-color', value)],
  shadowColorExpression: colorCssExpression,
  longTailProps: LONG_TAIL_STYLE_PROPS,
  unitlessProps: UNITLESS_STYLE_PROPS,
}

// display always compiles to an arbitrary property so every display value —
// including the base `inline` and numberOfLines' `-webkit-box` — shares one
// tailwind-merge group and the last one deterministically wins.
const textDisplayClass = (value: string): string => `[display:${value}]`

/**
 * Base classes reproducing what Tamagui's web `Text` contributes
 * (display:inline, box-sizing, margin 0, word-wrap/white-space defaults) —
 * verified head-to-head by the parity harness.
 */
export const BASE_CLASSES = '[display:inline] box-border m-0 [word-wrap:break-word] whitespace-pre-wrap'

/**
 * Compile one style object (no BASE_CLASSES) — the recursive unit.
 * `fontToken` is the element's global font context (see compile.ts): every
 * pool's `$`-relative fontSize/lineHeight tokens resolve against it, exactly
 * like Tamagui's single per-element font resolution. Standalone calls (tests)
 * fall back to the pool's own font.
 */
export function styleClasses(props: TextCompatStyleProps, fontToken?: string): string[] {
  fontToken = fontToken ?? effectiveFontToken(props)
  const cls: ClassList = [
    ...typographyClasses(props, fontToken),
    ...flexboxStyleClasses(props, textDisplayClass),
    ...commonStyleClasses(props, TEXT_STYLE_OPTIONS),
  ]
  return cls.filter((entry): entry is string => typeof entry === 'string' && entry !== '')
}
