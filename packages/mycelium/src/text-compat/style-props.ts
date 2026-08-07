/**
 * Long-tail style-prop tables for the Tamagui-compatible Text, derived from
 * the shared compat tables (`../compat/style-props`): the Text long tail is
 * the shared ViewStyle surface minus the props Text curates bespoke
 * (cursor/userSelect live in the typography compiler) plus the RN TextStyle
 * extras. Each compiles generically to Tailwind arbitrary-property utilities.
 */
import {
  LONG_TAIL_STYLE_PROPS as COMMON_LONG_TAIL_STYLE_PROPS,
  UNITLESS_STYLE_PROPS as COMMON_UNITLESS_STYLE_PROPS,
  type LongTailStyleProp as CommonLongTailStyleProp,
} from '../compat/style-props'

export { cssPropertyName } from '../compat/style-props'

/** Curated by the Text typography compiler — excluded from the generic long tail. */
type TextCuratedProp = 'cursor' | 'userSelect'
const TEXT_CURATED_PROPS: ReadonlySet<string> = new Set(['cursor', 'userSelect'] satisfies TextCuratedProp[])

/** RN TextStyle extras beyond the shared ViewStyle surface. */
const TEXT_EXTRA_LONG_TAIL_PROPS = ['fontVariant', 'textDecorationStyle', 'WebkitBoxOrient', 'WebkitLineClamp'] as const

export type LongTailStyleProp =
  | Exclude<CommonLongTailStyleProp, TextCuratedProp>
  | (typeof TEXT_EXTRA_LONG_TAIL_PROPS)[number]

export const LONG_TAIL_STYLE_PROPS: readonly LongTailStyleProp[] = [
  ...TEXT_EXTRA_LONG_TAIL_PROPS,
  ...COMMON_LONG_TAIL_STYLE_PROPS.filter(
    (prop): prop is Exclude<CommonLongTailStyleProp, TextCuratedProp> => !TEXT_CURATED_PROPS.has(prop),
  ),
]

/** Properties whose numeric values are unitless in CSS (no `px` suffix). */
export const UNITLESS_STYLE_PROPS: ReadonlySet<string> = new Set([
  ...COMMON_UNITLESS_STYLE_PROPS,
  'fontWeight',
  'WebkitLineClamp',
])
