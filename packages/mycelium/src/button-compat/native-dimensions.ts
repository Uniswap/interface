/**
 * The NATIVE half of ButtonCompat's dimension lane: which slice of
 * `ButtonCompatDimensionProps` the native leg wires vs dev-warns. Extracted
 * from `./dimensions` purely for the oxlint `max-lines` cap (the same
 * pressure that extracted `./dimensions` from `./compile` in the first
 * place); everything here stays pure and type-only-RN-safe.
 *
 * The dimension props the NATIVE leg deliberately does NOT wire: their only
 * call sites are web (`flexBasis` — `DappRequestContent`,
 * `QueuedOrderModal`'s `isWebPlatform` guard; `height`/`justifyContent`
 * likewise; `alignSelf` — the Auctions discovery CTA, a link-form call site
 * the native leg mounts no anchor for anyway; `display` —
 * its only call-site shape is web breakpoint-hiding via the media pools, which
 * the leg already drops wholesale, and most `DisplayValue`s don't exist under
 * Yoga), so the leg dev-warns them instead of painting them. Everything not
 * listed IS wired — the pick derives from `DIMENSION_PROP_KEYS`, so a prop
 * added to `ButtonCompatDimensionProps` rides the native lane automatically
 * unless it is excluded here on purpose (`borderColor` is deliberately NOT
 * excluded: semantic token classes are in the native safelist and non-token
 * values ride the style lane, the FlexCompat.native doctrine). Pinned by
 * `dimensions.test.ts`, so this set can only grow test-visibly, never drift.
 */
import { unwrapVariableForNativeStyle } from '../compat/tokens'
import { DIMENSION_PROP_KEYS, setDimensionProp, type ButtonCompatDimensionProps } from './dimensions'

/**
 * CSS-wide keyword colours the legacy web call sites pass (`'unset'` resets
 * to the frame border). RN's normalizeColor cannot parse them, and the raw
 * `border-[unset]` class would knock the frame's `border-transparent` out of
 * the merge while resolving to nothing — a black default border. So the pick
 * resolves-or-drops them (the overflow/shadowColor doctrine): the value is
 * excluded from both native lanes, reported through the dev-warn ledger, and
 * the frame's own border survives.
 */
const CSS_ONLY_COLOR_KEYWORDS: ReadonlySet<string> = new Set(['unset', 'inherit', 'initial', 'revert', 'currentcolor'])

function isCssOnlyBorderColor(value: NonNullable<ButtonCompatDimensionProps['borderColor']>): boolean {
  const resolved = unwrapVariableForNativeStyle(value)
  return typeof resolved === 'string' && CSS_ONLY_COLOR_KEYWORDS.has(resolved.toLowerCase())
}

export const NATIVE_DROPPED_DIMENSION_PROP_KEYS = [
  'height',
  'justifyContent',
  'flexBasis',
  'alignSelf',
  'display',
  'position',
  'top',
  'alignItems',
] as const satisfies readonly (keyof ButtonCompatDimensionProps)[]

const NATIVE_DROPPED_KEY_SET: ReadonlySet<keyof ButtonCompatDimensionProps> = new Set(
  NATIVE_DROPPED_DIMENSION_PROP_KEYS,
)

/** The native leg's wired slice — `DIMENSION_PROP_KEYS` minus the exclusions above, derived, never a hand list. */
export const NATIVE_DIMENSION_PROP_KEYS: readonly (keyof ButtonCompatDimensionProps)[] = DIMENSION_PROP_KEYS.filter(
  (key) => !NATIVE_DROPPED_KEY_SET.has(key),
)

/**
 * The wired dimension props actually SET, picked for the NATIVE leg: they ride
 * its spacing/layout lane — token classes on the frame className plus the
 * resolved values through `compatLayoutNativeStyle`. A pick, not a split: the
 * native leg never spreads a rest object onto its host, so nothing needs
 * removing. Derived rather than hand-listed so a future wired-on-native lane
 * prop cannot be silently omitted — one that is neither picked here nor in the
 * dev-warn ledger would paint nothing with no signal at all.
 */
export function buttonCompatNativeDimensions(props: ButtonCompatDimensionProps): ButtonCompatDimensionProps {
  const picked: ButtonCompatDimensionProps = {}
  for (const key of NATIVE_DIMENSION_PROP_KEYS) {
    setDimensionProp({ target: picked, key, value: props[key] })
  }
  if (picked.borderColor !== undefined && isCssOnlyBorderColor(picked.borderColor)) {
    delete picked.borderColor
  }
  return picked
}

/** The web-only dimension props actually SET — the native leg's dev-warn input: the key-level exclusion set the pick applies, plus the value-level borderColor drop. */
export function buttonCompatNativeDroppedDimensionNames(props: ButtonCompatDimensionProps): string[] {
  const names: string[] = NATIVE_DROPPED_DIMENSION_PROP_KEYS.filter((key) => props[key] !== undefined)
  if (props.borderColor !== undefined && isCssOnlyBorderColor(props.borderColor)) {
    names.push('borderColor')
  }
  return names
}
