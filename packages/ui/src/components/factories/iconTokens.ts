import { isWebPlatform } from '@universe/environment'
/**
 * Tamagui-free token tables and style-prop resolution for the icon factory.
 *
 * Local mirrors of the token values the old Tamagui `usePropsAndStyle` path resolved at
 * render time. Values come from the same `ui/src/theme` leaf modules that feed
 * `ui/src/theme/tokens.ts` (`createTokens`), so the numbers cannot drift; the key sets are
 * pinned compile-time (`satisfies Record<IconSizeTokens, number>`).
 */
import { type UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import { borderRadii } from 'ui/src/theme/borderRadii'
import { colors } from 'ui/src/theme/color/colors'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { shorthands } from 'ui/src/theme/shorthands'
import { gap, padding, spacing } from 'ui/src/theme/spacing'
import { themes } from 'ui/src/theme/themes'
import type { IconSizeTokens } from 'ui/src/theme/tokens'
import { zIndexes } from 'ui/src/theme/zIndexes'

/**
 * Which style dialect to emit: CSS (strings, web-only style keys, `data-testid`) or React Native
 * (transform arrays, `testID`). Mirrors which Tamagui dist the old pipeline loaded: every DOM
 * environment — real web AND the react-native-web vitest lanes of mobile/wallet/uniswap — got
 * Tamagui's web resolver, while on-device native (no `document`) got the native one. Keying on
 * `isWebPlatform` alone would flip the RNW test lanes to native-dialect output the DOM can't render.
 */
export const IS_WEB_STYLE_TARGET: boolean = isWebPlatform || typeof document !== 'undefined'

export type ThemeColorName = keyof (typeof themes)['light'] & string
export type PaletteColorName = keyof typeof colors & string

/**
 * The `$`-token half of the old `color` union (`ColorTokens | ThemeKeys`), re-derived without
 * Tamagui: theme keys resolve theme-aware, palette keys are theme-invariant. `(string & {})`
 * in the public union keeps raw CSS colors and `var()` expressions compiling, exactly as before.
 */
export type IconColorToken = `$${ThemeColorName}` | `$${PaletteColorName}` | ThemeColorName

const THEME_COLOR_NAMES: Record<string, true> = Object.fromEntries(
  Object.keys(themes.light).map((key) => [key, true]),
) as Record<string, true>

/** Mirrors the `icon` token map in ui/src/theme/tokens.ts — `satisfies` pins both key sets. */
export const ICON_SIZE_TOKEN_PX = {
  '$icon.true': iconSizes.icon40,
  '$icon.8': iconSizes.icon8,
  '$icon.12': iconSizes.icon12,
  '$icon.14': iconSizes.icon14,
  '$icon.16': iconSizes.icon16,
  '$icon.18': iconSizes.icon18,
  '$icon.20': iconSizes.icon20,
  '$icon.24': iconSizes.icon24,
  '$icon.28': iconSizes.icon28,
  '$icon.32': iconSizes.icon32,
  '$icon.36': iconSizes.icon36,
  '$icon.40': iconSizes.icon40,
  '$icon.48': iconSizes.icon48,
  '$icon.64': iconSizes.icon64,
  '$icon.70': iconSizes.icon70,
  '$icon.100': iconSizes.icon100,
} as const satisfies Record<IconSizeTokens, number>

/** Mirrors `space`/`size` in ui/src/theme/tokens.ts (spacing + padding + gap, `true` = spacing8). */
const SPACE_TOKEN_VALUE: Record<string, number> = { ...spacing, ...padding, ...gap, true: spacing.spacing8 }

const RADIUS_TOKEN_VALUE: Record<string, number> = { ...borderRadii, true: borderRadii.none }

const ZINDEX_TOKEN_VALUE: Record<string, number> = { ...zIndexes, true: zIndexes.default }

export type SpaceTokenName = (keyof typeof spacing | keyof typeof padding | keyof typeof gap) & string

export type IconSpaceValue = number | `$${SpaceTokenName}` | 'auto' | (string & {})

/**
 * Resolve a `color`-category value the way the old factory did: theme lookup first (theme-aware,
 * `$`-prefixed or bare — the old union allowed bare `ThemeKeys`), then the static palette for
 * `$` tokens, otherwise the raw value passes through (raw CSS colors, `var()`, `currentColor`).
 * Non-strings (e.g. `OpaqueColorValue` from `DynamicColorIOS`) pass through untouched.
 */
export function resolveIconColor(value: unknown, themeColors: UseSporeColorsReturn): unknown {
  if (typeof value !== 'string') {
    return value
  }
  const isToken = value.startsWith('$')
  const name = isToken ? value.slice(1) : value
  if (THEME_COLOR_NAMES[name]) {
    const entry = (themeColors as Partial<Record<string, { val: unknown }>>)[name]
    if (entry !== undefined) {
      return entry.val
    }
  }
  if (isToken) {
    const paletteValue = (colors as Partial<Record<string, string>>)[name]
    if (paletteValue !== undefined) {
      return paletteValue
    }
  }
  return value
}

type TokenCategory = 'color' | 'radius' | 'size' | 'space' | 'zIndex'

/**
 * Resolve any non-color token string (`$spacing4`, `$rounded12`, and the explicit-namespace
 * dotted form `$icon.24` / `$space.spacing8`). Unknown tokens pass through raw — same
 * render-as-is behavior the Tamagui resolver had for unknown values.
 */
function resolveNonColorToken(value: string, category: TokenCategory): number | string {
  const dotIndex = value.indexOf('.')
  if (dotIndex > 1) {
    const namespace = value.slice(1, dotIndex)
    const key = value.slice(dotIndex + 1)
    switch (namespace) {
      case 'icon':
        return (ICON_SIZE_TOKEN_PX as Record<string, number>)[value] ?? value
      case 'space':
      case 'size':
        return SPACE_TOKEN_VALUE[key] ?? value
      case 'radius':
        return RADIUS_TOKEN_VALUE[key] ?? value
      case 'zIndex':
        return ZINDEX_TOKEN_VALUE[key] ?? value
      default:
        return value
    }
  }
  const name = value.slice(1)
  switch (category) {
    case 'radius':
      return RADIUS_TOKEN_VALUE[name] ?? value
    case 'zIndex':
      return ZINDEX_TOKEN_VALUE[name] ?? value
    default:
      return SPACE_TOKEN_VALUE[name] ?? value
  }
}

/**
 * Resolve a width/height override the way the old pipeline resolved any `size`-category style
 * prop: `$` tokens to px, everything else (numbers, `'100%'`, `'auto'`) untouched.
 */
export function resolveIconDimension(value: unknown): unknown {
  return typeof value === 'string' && value.startsWith('$') ? resolveNonColorToken(value, 'size') : value
}

/**
 * Shorthand → full style prop, derived DIRECTLY from ui/src/theme/shorthands.ts (the only
 * shorthands the config enables) so the runtime table cannot drift from the config.
 */
export const STYLE_SHORTHANDS: Record<string, string> = shorthands

const COLOR_STYLE_KEYS: Record<string, true> = {
  backgroundColor: true,
  borderColor: true,
  borderBottomColor: true,
  borderTopColor: true,
  borderLeftColor: true,
  borderRightColor: true,
  borderEndColor: true,
  borderStartColor: true,
  shadowColor: true,
  color: true,
  textDecorationColor: true,
  textShadowColor: true,
  outlineColor: true,
  caretColor: true,
}

const RADIUS_STYLE_KEYS: Record<string, true> = {
  borderRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderTopStartRadius: true,
  borderTopEndRadius: true,
  borderBottomStartRadius: true,
  borderBottomEndRadius: true,
}

const SIZE_STYLE_KEYS: Record<string, true> = {
  width: true,
  height: true,
  minWidth: true,
  minHeight: true,
  maxWidth: true,
  maxHeight: true,
}

export const TRANSFORM_STYLE_KEYS: Record<string, true> = {
  x: true,
  y: true,
  scale: true,
  perspective: true,
  scaleX: true,
  scaleY: true,
  skewX: true,
  skewY: true,
  rotate: true,
  rotateX: true,
  rotateY: true,
  rotateZ: true,
}

/**
 * The rest of the Stack-valid style props (vendored key set from Tamagui's `stylePropsView`),
 * minus the color/radius/size/transform categories above. Membership decides the props→style
 * split, which must match the old `usePropsAndStyle` split: anything here lands on the SVG's
 * inline `style`, anything else passes through as an SVG prop.
 */
const OTHER_STYLE_KEYS: Record<string, true> = {
  backfaceVisibility: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  borderTopWidth: true,
  borderEndWidth: true,
  borderStartWidth: true,
  borderStyle: true,
  borderWidth: true,
  transform: true,
  transformOrigin: true,
  alignContent: true,
  alignItems: true,
  alignSelf: true,
  bottom: true,
  display: true,
  end: true,
  flexBasis: true,
  flexDirection: true,
  flexWrap: true,
  gap: true,
  columnGap: true,
  rowGap: true,
  justifyContent: true,
  left: true,
  margin: true,
  marginBottom: true,
  marginEnd: true,
  marginHorizontal: true,
  marginLeft: true,
  marginRight: true,
  marginStart: true,
  marginTop: true,
  marginVertical: true,
  overflow: true,
  padding: true,
  paddingBottom: true,
  paddingEnd: true,
  paddingHorizontal: true,
  paddingLeft: true,
  paddingRight: true,
  paddingStart: true,
  paddingTop: true,
  paddingVertical: true,
  position: true,
  right: true,
  start: true,
  top: true,
  inset: true,
  direction: true,
  shadowOffset: true,
  shadowRadius: true,
  flex: true,
  flexGrow: true,
  flexShrink: true,
  opacity: true,
  zIndex: true,
  aspectRatio: true,
  boxShadow: true,
  filter: true,
}

/** Style props Tamagui only treats as styles on web; on native they pass through as props, as before. */
const WEB_ONLY_STYLE_KEYS: Record<string, true> = {
  transition: true,
  cursor: true,
  pointerEvents: true,
  userSelect: true,
  touchAction: true,
  boxSizing: true,
  outlineStyle: true,
  outlineWidth: true,
  outlineOffset: true,
  overflowX: true,
  overflowY: true,
  backdropFilter: true,
  background: true,
  clipPath: true,
  mixBlendMode: true,
  objectFit: true,
  float: true,
  contain: true,
}

function categoryFor(key: string): TokenCategory {
  if (COLOR_STYLE_KEYS[key]) {
    return 'color'
  }
  if (RADIUS_STYLE_KEYS[key]) {
    return 'radius'
  }
  if (key === 'zIndex') {
    return 'zIndex'
  }
  if (SIZE_STYLE_KEYS[key]) {
    return 'size'
  }
  return 'space'
}

export interface ResolvedIconStyleProps {
  /** Props that are not style props — passed through to the SVG element, like the old `viewProps`. */
  passthrough: Record<string, unknown>
  /** Resolved inline style (tokens → concrete values), like the old resolved `style`. */
  style: Record<string, unknown>
}

interface ResolveOptions {
  themeColors: UseSporeColorsReturn
  isWeb: boolean
}

/**
 * Split a props bag into SVG passthrough props and a resolved inline style, mirroring the old
 * Tamagui `usePropsAndStyle(…, { resolveValues: 'value' })` behavior: shorthands expand, style
 * props resolve tokens to concrete values (theme-aware for colors), transform props collapse
 * into a platform-appropriate `transform`, and everything else passes through untouched.
 *
 * `size`, `color`, `width`, `height`, and `style` are the caller's responsibility — they carry
 * the icon-specific default/merge rules and are expected to be handled before calling this.
 */
export function resolveIconStyleProps(props: Record<string, unknown>, options: ResolveOptions): ResolvedIconStyleProps {
  const { themeColors, isWeb } = options
  const passthrough: Record<string, unknown> = {}
  const style: Record<string, unknown> = {}
  const transformParts: Array<{ key: string; value: unknown }> = []

  for (const keyIn of Object.keys(props)) {
    const value = props[keyIn]
    if (value === undefined) {
      continue
    }
    const key = STYLE_SHORTHANDS[keyIn] ?? keyIn

    if (TRANSFORM_STYLE_KEYS[key] && key !== 'transform') {
      transformParts.push({ key, value })
      continue
    }
    if (key === 'transform') {
      // Raw transform passes through in front of individual transform props, like Tamagui's ordering
      transformParts.unshift({ key, value })
      continue
    }

    const isStyleKey =
      COLOR_STYLE_KEYS[key] === true ||
      RADIUS_STYLE_KEYS[key] === true ||
      SIZE_STYLE_KEYS[key] === true ||
      OTHER_STYLE_KEYS[key] === true ||
      (isWeb && WEB_ONLY_STYLE_KEYS[key] === true)

    if (!isStyleKey) {
      passthrough[keyIn] = value
      continue
    }

    const category = categoryFor(key)
    let resolved: unknown = value
    if (category === 'color') {
      resolved = resolveIconColor(value, themeColors)
    } else if (typeof value === 'string' && value.startsWith('$')) {
      resolved = resolveNonColorToken(value, category)
    }
    assignStyle({ style, key, value: resolved, isWeb })
  }

  if (transformParts.length > 0) {
    style['transform'] = buildTransform(transformParts, isWeb)
  }

  return { passthrough, style }
}

/** RN-only axis shorthands don't exist in CSS — expand them on web so the DOM gets valid declarations. */
function assignStyle(args: { style: Record<string, unknown>; key: string; value: unknown; isWeb: boolean }): void {
  const { style, key, value, isWeb } = args
  if (!isWeb) {
    style[key] = value
    return
  }
  switch (key) {
    case 'marginHorizontal':
      style['marginLeft'] = value
      style['marginRight'] = value
      return
    case 'marginVertical':
      style['marginTop'] = value
      style['marginBottom'] = value
      return
    case 'paddingHorizontal':
      style['paddingLeft'] = value
      style['paddingRight'] = value
      return
    case 'paddingVertical':
      style['paddingTop'] = value
      style['paddingBottom'] = value
      return
    case 'marginStart':
      style['marginInlineStart'] = value
      return
    case 'marginEnd':
      style['marginInlineEnd'] = value
      return
    case 'paddingStart':
      style['paddingInlineStart'] = value
      return
    case 'paddingEnd':
      style['paddingInlineEnd'] = value
      return
    default:
      style[key] = value
  }
}

function buildTransform(parts: Array<{ key: string; value: unknown }>, isWeb: boolean): unknown {
  // A string `transform` clobbers the individual transform props on EVERY dialect — Tamagui's
  // mergeTransform early-returns once style.transform is a string, so the old pipeline dropped
  // sibling rotate/scale/x/y parts whether on web or on device. Matched here so both dialects
  // agree (no real call site combines them; the factory test pins the clobber).
  const stringTransform = parts.find(({ key, value }) => key === 'transform' && typeof value === 'string')
  if (stringTransform) {
    return stringTransform.value
  }

  if (isWeb) {
    const css = parts
      .map(({ key, value }) => (key === 'transform' ? '' : toCssTransformFunction(key, value)))
      .filter((part) => part !== '')
      .join(' ')
    return css === '' ? undefined : css
  }

  const list: unknown[] = []
  for (const { key, value } of parts) {
    if (key === 'transform') {
      if (Array.isArray(value)) {
        list.push(...(value as unknown[]))
      }
      continue
    }
    const rnKey = key === 'x' ? 'translateX' : key === 'y' ? 'translateY' : key
    list.push({ [rnKey]: value })
  }
  return list.length > 0 ? list : undefined
}

function toCssTransformFunction(key: string, value: unknown): string {
  const cssValue = typeof value === 'number' ? withUnitFor(key, value) : String(value)
  switch (key) {
    case 'x':
      return `translateX(${cssValue})`
    case 'y':
      return `translateY(${cssValue})`
    default:
      return `${key}(${cssValue})`
  }
}

function withUnitFor(key: string, value: number): string {
  switch (key) {
    case 'x':
    case 'y':
    case 'perspective':
      return `${value}px`
    case 'rotate':
    case 'rotateX':
    case 'rotateY':
    case 'rotateZ':
    case 'skewX':
    case 'skewY':
      return `${value}deg`
    default:
      return String(value)
  }
}
