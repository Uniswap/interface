/**
 * Native-dialect resolvers for the icon compat surface (INFRA-3508), imported
 * only by `createIcon.native.tsx`: every supported style prop resolves to a plain
 * React Native inline-style value — literal theme colors (no `var()`, CSS
 * variables do not exist on device), numeric px, RN transform arrays — with
 * the same token acceptance as the web lane: an unknown `$` COLOUR token logs
 * one error and emits no colour, every other unknown token still throws, and a
 * raw token string is never rendered either way.
 *
 * Deliberately NOT named `icon-props.native.ts`: a platform-suffixed sibling
 * of `icon-props.ts` would shadow the shared module for every native
 * consumer; this file is an ordinary module the native leg imports by name.
 */
import type { UseSporeColorsReturn } from '../theme-hooks-compat/useSporeColors'
import { iconColorOrLog } from './diagnostics'
import type { IconCompatStyleProps, IconSize } from './icon-props'
import { PX_STRING } from './native-values'
import { lookupToken, SPACE_TOKEN_PX } from './tokens'

/** Resolved RN style draft (react-native-svg accepts the plain-object dialect). */
export interface IconNativeStyle {
  color?: string
  fill?: string
  width?: number | string
  height?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  flexShrink?: number
  alignSelf?: string
  display?: string
  margin?: number | string
  marginLeft?: number | string
  marginRight?: number | string
  marginTop?: number | string
  marginEnd?: number | string
  padding?: number | string
  opacity?: number
  pointerEvents?: string
  /** RN transform: object array from `rotate`, or a raw string (RN accepts both). */
  transform?: Array<Record<string, string>> | string
  position?: string
  left?: number | string
}

/**
 * Resolve a color value for the native lane: `$` tokens resolve theme-aware
 * to the LITERAL value of the active theme via the compat theme map (the
 * `useSporeColors` native leg follows uniwind's runtime theme, so a theme
 * flip re-renders with the other literal — the legacy device behavior).
 * Non-token strings pass through; a token outside the supported map LOGS AN
 * ERROR and returns `undefined` (emit no colour, leave the style channel alone),
 * the same acceptance set as the web lane's `resolveIconColor`. Every
 * supported token name (minus `$`) is a legacy theme color name in the
 * generated theme maps, verified by `createIcon.native.test.tsx`.
 */
export function resolveIconColorNative(value: string, colors: UseSporeColorsReturn): string | undefined {
  if (!value.startsWith('$')) {
    return value
  }
  // Membership only — `iconColorOrLog` returns the WEB lane's CSS expression,
  // unusable on device; the literal comes from `colors` below. Delegating keeps
  // both lanes' acceptance sets identical by construction, and routes both
  // through the one bounded reporter instead of a second copy.
  if (iconColorOrLog(value) === undefined) {
    return undefined
  }
  // Explicit membership rather than trusting the acceptance set to be a subset
  // of the theme map: if a future fallback ever accepts a token the native
  // theme has no entry for, `entry.val` would be a TypeError on device instead
  // of the drop this lane promises.
  const entry = (colors as Partial<UseSporeColorsReturn>)[value as keyof UseSporeColorsReturn]
  return entry?.val
}

/**
 * Space/size values for RN style keys: numbers pass through, `$` tokens
 * resolve to px numbers (unknown tokens throw — the `sizeValue` posture),
 * `"<n>px"` strings lose their unit (census-live raw CSS strings on the base
 * lane; RN wants plain numbers), everything else (`'auto'`, percentages)
 * passes through — RN accepts both.
 */
export function sizeValueNative(value: number | string, label = 'size'): number | string {
  if (typeof value === 'number') {
    return value
  }
  if (value.startsWith('$')) {
    const px = lookupToken(SPACE_TOKEN_PX, value)
    if (px === undefined) {
      throw new Error(`compat: unknown ${label} token "${value}"`)
    }
    return px
  }
  const pxMatch = PX_STRING.exec(value)
  return pxMatch?.[1] !== undefined ? Number(pxMatch[1]) : value
}

type IconCssLaneProp = Exclude<keyof IconCompatStyleProps, 'size' | 'color'>

/**
 * The native resolver per CSS-lane prop — same key set as the web lane's
 * `ICON_CSS_LANE_RESOLVERS` (the mapped type keeps it exhaustive), same
 * shorthand-before-longhand declaration order. Dialect differences:
 * spacing/sizing resolve to numbers, `marginEnd` uses RN's own `marginEnd`
 * (no `marginInlineEnd` on device), `rotate` becomes an RN transform array,
 * and a raw `transform` string clobbers it (declared after — the Tamagui
 * rule, matching the web lane). `cursor` and
 * `verticalAlign` are web-only CSS with no RN style counterpart: dropped,
 * matching the legacy factory where they were inert on device.
 */
export const ICON_NATIVE_LANE_RESOLVERS: {
  [K in IconCssLaneProp]-?: (value: NonNullable<IconCompatStyleProps[K]>, style: IconNativeStyle) => void
} = {
  flexShrink: (value, style) => {
    style.flexShrink = value
  },
  alignSelf: (value, style) => {
    style.alignSelf = value
  },
  display: (value, style) => {
    style.display = value
  },
  margin: (value, style) => {
    style.margin = sizeValueNative(value)
  },
  mx: (value, style) => {
    style.marginLeft = sizeValueNative(value)
    style.marginRight = sizeValueNative(value)
  },
  ml: (value, style) => {
    style.marginLeft = sizeValueNative(value)
  },
  mr: (value, style) => {
    style.marginRight = sizeValueNative(value)
  },
  mt: (value, style) => {
    style.marginTop = sizeValueNative(value)
  },
  marginEnd: (value, style) => {
    style.marginEnd = sizeValueNative(value)
  },
  padding: (value, style) => {
    style.padding = sizeValueNative(value)
  },
  width: (value, style) => {
    style.width = sizeValueNative(value)
  },
  height: (value, style) => {
    style.height = sizeValueNative(value)
  },
  minWidth: (value, style) => {
    style.minWidth = sizeValueNative(value)
  },
  maxWidth: (value, style) => {
    style.maxWidth = sizeValueNative(value)
  },
  opacity: (value, style) => {
    style.opacity = value
  },
  cursor: () => {
    // web-only CSS — inert on device, like the legacy factory
  },
  pointerEvents: (value, style) => {
    style.pointerEvents = value
  },
  verticalAlign: () => {
    // web-only CSS — inert on device, like the legacy factory
  },
  rotate: (value, style) => {
    style.transform = [{ rotate: value }]
  },
  transform: (value, style) => {
    // A string transform clobbers `rotate` on every dialect (Tamagui's
    // mergeTransform rule; RN accepts the string form).
    style.transform = value
  },
  // INFRA-3320 widening (packages/wallet ChooseNftModal.tsx's absolutely-
  // positioned close icon): RN's `position`/`left` map directly, no dialect
  // difference from the web lane beyond the shared numeric-px resolution.
  position: (value, style) => {
    style.position = value
  },
  left: (value, style) => {
    style.left = sizeValueNative(value)
  },
}

/** Resolve CSS-lane props into the RN style draft, in resolver-map order (JSX attribute order never matters). */
export function applyIconNativeLane(props: IconCompatStyleProps, style: IconNativeStyle): void {
  for (const key of Object.keys(ICON_NATIVE_LANE_RESOLVERS) as IconCssLaneProp[]) {
    const value = props[key]
    if (value !== undefined) {
      ;(ICON_NATIVE_LANE_RESOLVERS[key] as (value: unknown, style: IconNativeStyle) => void)(value, style)
    }
  }
}

/**
 * Media pool keys the native leg honors, in the legacy precedence order
 * (`ui/src/theme/media.ts`, weakest first — later, narrower entries
 * override). The booleans come from the compat `useMedia` native leg
 * (Dimensions-driven), so pooled `$xs`/`$sm` styles apply on device exactly
 * like the legacy factory's `useActiveMediaStyles`.
 */
export const NATIVE_MEDIA_POOL_KEYS = [
  '$xxxl',
  '$xxl',
  '$xl',
  '$lg',
  '$md',
  '$sm',
  '$xs',
  '$xxs',
  '$short',
  '$midHeight',
  '$lgHeight',
] as const

const NATIVE_MEDIA_POOL_KEY_SET: ReadonlySet<string> = new Set(NATIVE_MEDIA_POOL_KEYS)

export interface NativePoolResolution {
  /** The effective base-lane props after active media overrides. */
  cssLane: IconCompatStyleProps
  size: IconSize | undefined
  color: string | null | undefined
}

/**
 * Apply the `$` pools on the native dialect. Media pools merge their style
 * over the base when active (base < media, legacy order); `$group-*` pools
 * are deliberately inert — neither hover, press, nor focus fires on device,
 * matching both the legacy factory (group hover is web-gated) and the
 * shipped compat native legs (`CheckboxCompat.native.tsx`). Any other `$`
 * key throws, the web pool walk's fail-closed posture.
 *
 * A media pool's `color` overwrites the base ONLY when it actually resolves.
 * It used to overwrite with the raw token before the token was known to
 * resolve, so an unmapped pool colour dropped a MAPPED base and the glyph
 * rendered with no colour at all — the one outcome this lane exists to rule
 * out, since an unresolvable colour must cost one colour and not the base it
 * was layered over. `colors` is threaded in so that decision runs through the
 * same resolver the caller applies, which is why the pool and the final style
 * channel cannot diverge; the web lane decides on what its compiler emits for
 * exactly the same reason.
 */
export function resolveNativePools(args: {
  pools: Record<string, IconCompatStyleProps>
  cssLane: IconCompatStyleProps
  size: IconSize | undefined
  color: string | null | undefined
  colors: UseSporeColorsReturn
  activeMedia: Readonly<Record<string, boolean>>
}): NativePoolResolution {
  const { pools, cssLane, size, color, colors, activeMedia } = args
  const resolution: NativePoolResolution = { cssLane: { ...cssLane }, size, color }

  for (const key of Object.keys(pools)) {
    if (key.startsWith('$group-')) {
      continue
    }
    if (!NATIVE_MEDIA_POOL_KEY_SET.has(key)) {
      throw new Error(`mycelium icons: unsupported pool prop "${key}" on the native leg`)
    }
  }

  for (const key of NATIVE_MEDIA_POOL_KEYS) {
    const poolStyle = pools[key]
    if (poolStyle === undefined || activeMedia[key.slice(1)] !== true) {
      continue
    }
    for (const [prop, value] of Object.entries(poolStyle)) {
      if (value === undefined) {
        continue
      }
      if (prop === 'size') {
        resolution.size = value as IconSize
      } else if (prop === 'color') {
        // Guarded: an unresolvable token costs its own layer, never the base.
        if (typeof value !== 'string' || resolveIconColorNative(value, colors) !== undefined) {
          resolution.color = value as string
        }
      } else {
        ;(resolution.cssLane as Record<string, unknown>)[prop] = value
      }
    }
  }

  return resolution
}
