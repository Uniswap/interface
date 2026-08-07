/**
 * Resolve the TouchableArea wrapper + frame semantics into a plain compat
 * prop object the generic pool orchestration (`../compat/compose`) compiles:
 * variant styles, hoverable/focusable gating, the composed press pool
 * (styled-options scale 0.98 + scaleTo + activeOpacity + user pressStyle),
 * the always-on focus-visible ring, and disabled folding into the base pool.
 *
 * Every value here is pinned from the legacy source
 * (`ui/src/components/touchable/TouchableArea/TouchableAreaFrame.web.tsx` and
 * `TouchableArea.tsx`) and proven against the real component's emitted CSS by
 * `packages/tailwind/src/parity/touchable-area`.
 *
 * Pseudo-pool precedence mirrors what the legacy component actually renders
 * (verified by the parity matrix): a user pseudo prop replaces the VARIANT's
 * pseudo pool but still merges over the styled-options defaults — and because
 * the legacy wrapper always passes a `pressStyle` prop, a variant's own
 * pressStyle (e.g. unstyled's scale 1) is unreachable through TouchableArea.
 */
import type { CompatProps } from '../compat/props'
import type {
  TouchableAreaCompatProps,
  TouchableAreaCompatStyleProps,
  TouchableAreaSpecificProps,
  TouchableAreaVariant,
} from './props'

/** `commonPressStyle` / `FOCUS_SCALE` from the legacy CustomButtonFrame constants. */
const PRESS_SCALE = 0.98
const FOCUS_SCALE = 0.98

/** Default pressed opacity (the legacy `activeOpacity` default). */
const DEFAULT_ACTIVE_OPACITY = 0.75

/**
 * `$surface5Hovered` has no `@universe/tailwind` counterpart; both spore
 * themes define it as rgba(0,0,0,0.06) — pinned here, guarded by the parity
 * matrix (the hoverStyle token rows fail if the spore value moves).
 */
export const SURFACE5_HOVERED = 'rgba(0,0,0,0.06)'

/**
 * The raised variant's per-theme web shadows: the legacy variant composes its
 * `boxShadow` literal with a zero-offset `shadowColor` shadow. Alphas are
 * pinned post-quantization (Tamagui parses 0.02 → 5/255) so the emitted CSS
 * is byte-identical to the legacy output.
 */
const RAISED_SHADOW_DARK =
  '0px 1px 6px 2px rgba(0,0,0,0.54), 0px 1px 2px 0px rgba(0,0,0,0.4), 0px 0px 0px rgba(0,0,0,0.4)'
const RAISED_SHADOW_LIGHT =
  '0px 1px 6px 2px rgba(0,0,0,0.03), 0px 1px 2px 0px rgba(0,0,0,0.02), 0px 0px 0px rgba(0,0,0,0.0196)'

type Style = TouchableAreaCompatStyleProps

interface VariantDefinition {
  base?: Style
  /** Applied only while `hoverable !== false` and no user hoverStyle is given. */
  hover?: Style
  /** Merged over the styled-options focus-visible defaults. */
  focusVisible?: Style
  themeDark?: Style
  themeLight?: Style
  /** Extra base styles the variant applies while disabled. */
  disabledBase?: Style
  /** Base styles the variant applies only while NOT disabled. */
  enabledBase?: Style
}

const VARIANT_DEFINITIONS: Record<TouchableAreaVariant, VariantDefinition> = {
  unstyled: {
    focusVisible: { outlineColor: '$neutral3' },
  },
  none: {
    hover: { backgroundColor: '$surface2Hovered' },
    focusVisible: { backgroundColor: '$surface2Hovered', outlineColor: '$neutral3' },
  },
  outlined: {
    base: { borderWidth: 1, borderColor: '$surface3' },
    hover: { borderColor: '$surface3Hovered', backgroundColor: '$surface2Hovered' },
    focusVisible: { borderColor: '$surface3Hovered', backgroundColor: '$surface2Hovered', outlineColor: '$neutral3' },
  },
  filled: {
    base: { backgroundColor: '$surface3' },
    hover: { borderColor: '$surface3Hovered', backgroundColor: '$surface3Hovered' },
    focusVisible: { borderColor: '$surface3Hovered', backgroundColor: '$surface3Hovered', outlineColor: '$neutral3' },
  },
  raised: {
    base: { borderWidth: 1, borderColor: '$surface3' },
    enabledBase: {},
    hover: { borderColor: '$surface3Hovered' },
    focusVisible: { borderColor: '$surface3Hovered', outlineColor: '$neutral3' },
    themeDark: { boxShadow: RAISED_SHADOW_DARK },
    themeLight: { boxShadow: RAISED_SHADOW_LIGHT },
    disabledBase: { backgroundColor: '$surface2' },
  },
  floating: {
    // WebkitBackdropFilter beside backdropFilter, like the legacy variant
    // (Safari ≤17 only supports the prefixed property).
    base: { backgroundColor: '$surface5', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
    hover: { backgroundColor: SURFACE5_HOVERED },
    focusVisible: { backgroundColor: SURFACE5_HOVERED, outlineColor: '$neutral3' },
  },
}

/** The styled-options focus-visible defaults (scale ring + outline geometry). */
const OPTIONS_FOCUS_VISIBLE: Style = {
  scaleX: FOCUS_SCALE,
  scaleY: FOCUS_SCALE,
  outlineWidth: 1,
  outlineOffset: 1,
  outlineStyle: 'solid',
}

/** `focusable={false}` neutralizes the focus-visible pool (legacy variant). */
const UNFOCUSABLE_FOCUS_VISIBLE: Style = {
  scaleX: 1,
  scaleY: 1,
  backgroundColor: '$transparent',
  borderColor: '$transparent',
}

/** The disabled variant's base styles (web: pointer-events none via $platform-web). */
const DISABLED_BASE: Style = {
  userSelect: 'none',
  opacity: 0.6,
  pointerEvents: 'none',
  cursor: 'default',
}

const SPECIFIC_PROP_KEYS: ReadonlyArray<keyof TouchableAreaSpecificProps> = [
  'variant',
  'hoverable',
  'focusable',
  'scaleTo',
  'activeOpacity',
  'ignoreDragEvents',
  'shouldConsiderMinimumDimensions',
  'shouldStopPropagation',
  'shouldAutomaticallyInjectColors',
  'modifierPressHref',
  'onModifierPress',
]

const PRESS_TRANSFORM_PROPS = [
  'x',
  'y',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'scaleX',
  'scaleY',
  'skewX',
  'skewY',
  'perspective',
] as const

/**
 * When the press pool combines the default `scale` with other transform
 * props, the legacy output orders `scale()` first (the styled-options value)
 * before the runtime-merged functions — expressed as an ordered transform
 * entry list so the emitted declaration is byte-identical.
 */
function orderedPressTransform(pool: Style): Style {
  if (pool.scale === undefined || pool.transform !== undefined) {
    return pool
  }
  const others = PRESS_TRANSFORM_PROPS.filter((key) => pool[key] !== undefined)
  if (others.length === 0) {
    return pool
  }
  const { scale, ...rest } = pool
  const remaining = rest as Style
  const entries: Array<Record<string, string | number>> = [{ scale }]
  for (const key of [...others].sort().reverse()) {
    entries.push({ [key]: pool[key] as string | number })
    delete (remaining as Record<string, unknown>)[key]
  }
  return { ...remaining, transform: entries }
}

function mergeStyles(...styles: Array<Style | undefined>): Style | undefined {
  const present = styles.filter((style): style is Style => style !== undefined)
  if (present.length === 0) {
    return undefined
  }
  return Object.assign({}, ...present) as Style
}

/**
 * The compat prop object the compiler and the parity expectations both
 * consume: the shared pool surface with the TouchableArea semantics folded in.
 */
export type ResolvedTouchableAreaProps = CompatProps<TouchableAreaCompatStyleProps>

export function resolveTouchableAreaCompatProps(props: TouchableAreaCompatProps): ResolvedTouchableAreaProps {
  const {
    variant = 'unstyled',
    hoverable = true,
    focusable = true,
    scaleTo,
    activeOpacity = DEFAULT_ACTIVE_OPACITY,
    disabled,
  } = props
  const definition = VARIANT_DEFINITIONS[variant]

  const rest: Record<string, unknown> = { ...props }
  for (const key of SPECIFIC_PROP_KEYS) {
    delete rest[key]
  }

  // Press pool: styled-options default scale + the wrapper's scaleTo /
  // activeOpacity + the user pressStyle, per-property, later wins. The
  // variant's own pressStyle is unreachable (see module docs).
  const pressStyle = orderedPressTransform(
    mergeStyles(
      { scale: PRESS_SCALE },
      // Truthiness on purpose, matching the legacy wrapper: scaleTo={0} and
      // activeOpacity={0} are ignored, not compiled.
      scaleTo ? { scale: scaleTo } : undefined,
      activeOpacity ? { opacity: activeOpacity } : undefined,
      props.pressStyle,
    ) as Style,
  )

  // Hover pool: the variant's hover styles (dropped by hoverable=false) under
  // the user hoverStyle, per-property — the legacy function-variants merge.
  const hoverStyle = mergeStyles(hoverable !== false ? definition.hover : undefined, props.hoverStyle)

  // Focus-visible pool: options defaults, the variant's ring colors, the
  // focusable=false neutralizer (which keeps the variant's outline color —
  // the legacy variant merge), then any user focusVisibleStyle.
  const focusVisibleStyle = mergeStyles(
    OPTIONS_FOCUS_VISIBLE,
    definition.focusVisible,
    focusable === false ? UNFOCUSABLE_FOCUS_VISIBLE : undefined,
    props.focusVisibleStyle,
  )

  const base = mergeStyles(
    definition.base,
    disabled === true ? mergeStyles(DISABLED_BASE, definition.disabledBase) : definition.enabledBase,
    focusable === false ? { outlineStyle: 'none' } : undefined,
    rest as Style,
  )

  const resolved: ResolvedTouchableAreaProps = {
    ...(base as ResolvedTouchableAreaProps),
    pressStyle,
    hoverStyle,
    focusVisibleStyle,
    group: props.group ?? true,
  }

  const themeDark = mergeStyles(disabled === true ? undefined : definition.themeDark, props['$theme-dark'])
  if (themeDark !== undefined) {
    resolved['$theme-dark'] = themeDark
  }
  const themeLight = mergeStyles(disabled === true ? undefined : definition.themeLight, props['$theme-light'])
  if (themeLight !== undefined) {
    resolved['$theme-light'] = themeLight
  }

  return resolved
}
