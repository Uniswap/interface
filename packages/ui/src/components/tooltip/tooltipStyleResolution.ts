import { isProdEnv } from '@universe/environment'
import { type UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import type { CSSProperties } from 'react'
import {
  TOOLTIP_ANIMATION_OFFSET,
  TOOLTIP_ARROW_SIZE,
  TOOLTIP_BORDER_WIDTH,
  TOOLTIP_CONTENT_BORDER_RADIUS,
  TOOLTIP_CONTENT_GAP,
  TOOLTIP_CONTENT_MAX_WIDTH,
  TOOLTIP_CONTENT_PADDING,
} from 'ui/src/components/tooltip/shared'
import type { TooltipAnimationDirection, TooltipFrameStyleProps } from 'ui/src/components/tooltip/types'
// `gap` aliased: it collides with the style prop destructured in resolveTooltipStyleProps.
import { borderRadii, gap as gapTokens, padding as paddingTokens, spacing } from 'ui/src/theme'

/** All three space-token families call sites use (`$spacing*`, `$padding*`, `$gap*`). */
const SPACE_TOKENS: Record<string, number> = { ...spacing, ...paddingTokens, ...gapTokens }

/**
 * Token → concrete-value resolution for the rebuilt Tooltip's web leg (INFRA-3318):
 * the legacy Tamagui stack props call sites pass to `Tooltip.Content`/`Tooltip.Trigger`,
 * resolved to plain inline CSS (no class emission — INFRA-3285 keeps `packages/ui`
 * out of every Tailwind `@source` scan). Follows the Input rebuild's resolver
 * conventions (theme colors via useSporeColors, `var(--<themeKey>)` unwrapping).
 *
 * Unknown-$-token policy: space resolvers throw outside prod, i.e. `!isProdEnv()` — dev,
 * test, and staging (a bad token is a call-site bug); radius deliberately falls back to
 * the frame default; color pass-through is legacy behavior. New resolvers should throw
 * outside prod, not invent a fourth policy.
 */

function resolveSpace(value: number | string | undefined): number | string | undefined {
  if (typeof value !== 'string' || !value.startsWith('$')) {
    return value
  }
  const token = value.slice(1)
  if (token in SPACE_TOKENS) {
    return SPACE_TOKENS[token]
  }
  // An unrecognized $token is a call-site bug, never a valid CSS value: CSSOM rejects the
  // literal silently and the frame default wins — a silent geometry fallback (INFRA-3657).
  // Throw where a developer will see it — including staging, not just dev/test — and keep
  // the legacy pass-through in prod only (the non-token string escape hatch for values like
  // "50%"/"auto" stays above).
  if (!isProdEnv()) {
    throw new Error(
      `Tooltip: unknown space token "${value}" — not in the spacing/padding/gap maps (ui/src/theme/spacing.ts)`,
    )
  }
  return value
}

function resolveRadius(value: number | string | undefined): number | string | undefined {
  if (typeof value !== 'string' || !value.startsWith('$')) {
    // Non-token strings ("50%") pass through instead of indexing borderRadii with a bad key.
    return value
  }
  // An unrecognized $token resolves to undefined, and the caller OMITS the property so
  // the frame default (rounded12) survives instead of erasing the radius entirely.
  return borderRadii[value.slice(1) as keyof typeof borderRadii]
}

/**
 * `$<themeKey>` tokens and Tamagui-delivered `var(--<themeKey>)` references resolve to
 * the live theme value (the Input rebuild's resolver pattern — deterministic in any DOM
 * and independent of Tamagui's injected CSS variables surviving the migration); other
 * strings ('transparent', hex, rgba) pass through.
 */
export function resolveTooltipColor(colors: UseSporeColorsReturn, value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }
  const themeVarKey = /^var\(--([A-Za-z0-9]+)\)$/.exec(value)?.[1]
  const lookupKey = themeVarKey ?? (value.startsWith('$') ? value.slice(1) : undefined)
  if (lookupKey === undefined) {
    return value
  }
  const token = (colors as Record<string, UseSporeColorsReturn[keyof UseSporeColorsReturn] | undefined>)[lookupKey]
  return token === undefined ? value : String(token.val)
}

/** Fold an opacity into a hex/rgb(a) color, like the legacy shadowOpacity composition. */
export function applyShadowAlpha(color: string, opacity: number | undefined): string {
  if (opacity === undefined || opacity >= 1) {
    return color
  }
  const hex = /^#([0-9a-fA-F]{6})$/.exec(color)
  if (hex?.[1] !== undefined) {
    const n = Number.parseInt(hex[1], 16)
    // oxlint-disable-next-line no-bitwise -- hex channel unpacking
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`
  }
  const rgba = /^rgba?\(([^)]+)\)$/.exec(color)
  if (rgba?.[1] !== undefined) {
    const parts = rgba[1].split(',').map((part) => part.trim())
    const [r, g, b, a = '1'] = parts
    return `rgba(${r}, ${g}, ${b}, ${Number.parseFloat(a) * opacity})`
  }
  return color
}

type Edge = 'Top' | 'Bottom' | 'Left' | 'Right'
const ALL_EDGES: readonly Edge[] = ['Top', 'Bottom', 'Left', 'Right']
const HORIZONTAL_EDGES: readonly Edge[] = ['Left', 'Right']
const VERTICAL_EDGES: readonly Edge[] = ['Top', 'Bottom']

const PADDING_ALIAS_EDGES: Record<string, readonly Edge[]> = {
  p: ALL_EDGES,
  padding: ALL_EDGES,
  px: HORIZONTAL_EDGES,
  paddingHorizontal: HORIZONTAL_EDGES,
  py: VERTICAL_EDGES,
  paddingVertical: VERTICAL_EDGES,
  paddingLeft: ['Left'],
  paddingRight: ['Right'],
  paddingTop: ['Top'],
  paddingBottom: ['Bottom'],
}

const MARGIN_ALIAS_EDGES: Record<string, readonly Edge[]> = {
  m: ALL_EDGES,
  margin: ALL_EDGES,
  mx: HORIZONTAL_EDGES,
  marginHorizontal: HORIZONTAL_EDGES,
  my: VERTICAL_EDGES,
  marginVertical: VERTICAL_EDGES,
  ml: ['Left'],
  marginLeft: ['Left'],
  mr: ['Right'],
  marginRight: ['Right'],
  mt: ['Top'],
  marginTop: ['Top'],
  mb: ['Bottom'],
  marginBottom: ['Bottom'],
}

/**
 * Expand the margin/padding shorthand families into concrete edges in PROP INSERTION
 * ORDER — Tamagui folds aliases in object order, so a later `p: 0` overrides an earlier
 * `px: 8` on the shared edges, and vice versa. JSX/object spread preserves author order,
 * which is exactly the order Object.entries walks here.
 */
function resolveEdgeShorthands({
  resolved,
  styleProps,
}: {
  resolved: Record<string, number | string | undefined>
  styleProps: TooltipFrameStyleProps
}): void {
  for (const [key, rawValue] of Object.entries(styleProps)) {
    const edges = PADDING_ALIAS_EDGES[key] ?? MARGIN_ALIAS_EDGES[key]
    if (edges === undefined || rawValue === undefined) {
      continue
    }
    const property = key in PADDING_ALIAS_EDGES ? 'padding' : 'margin'
    for (const edge of edges) {
      resolved[`${property}${edge}`] = resolveSpace(rawValue as number | string)
    }
  }
}

/**
 * Resolve one Tooltip style-prop bag into flat inline CSS: theme/spacing/radius tokens
 * replaced by concrete values, spacing shorthands expanded in prop insertion order
 * (Tamagui's alias folding — a later `p` overrides an earlier `px` and vice versa),
 * RN shadow* props folded into `boxShadow` (the same conversion RNW applied),
 * `$platform-web` merged last.
 */
export function resolveTooltipStyleProps(
  colors: UseSporeColorsReturn,
  styleProps: TooltipFrameStyleProps,
): CSSProperties {
  const resolved: Record<string, number | string | undefined> = {}

  const {
    backgroundColor,
    borderColor,
    borderWidth,
    borderRadius,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    flex,
    flexDirection,
    alignItems,
    justifyContent,
    alignSelf,
    gap,
    position,
    top,
    bottom,
    left,
    right,
    display,
    overflow,
    opacity,
    cursor,
    pointerEvents,
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
  } = styleProps

  if (backgroundColor !== undefined) {
    resolved['backgroundColor'] = resolveTooltipColor(colors, backgroundColor)
  }
  if (borderColor !== undefined) {
    resolved['borderColor'] = resolveTooltipColor(colors, borderColor)
  }
  if (borderWidth !== undefined) {
    resolved['borderWidth'] = resolveSpace(borderWidth)
    resolved['borderStyle'] = 'solid'
  }
  if (borderRadius !== undefined) {
    const resolvedRadius = resolveRadius(borderRadius)
    if (resolvedRadius !== undefined) {
      resolved['borderRadius'] = resolvedRadius
    }
  }

  const spaceEntries: Array<[string, number | string | undefined]> = [
    ['width', width],
    ['height', height],
    ['minWidth', minWidth],
    ['minHeight', minHeight],
    ['maxWidth', maxWidth],
    ['maxHeight', maxHeight],
    ['gap', gap],
    ['top', top],
    ['bottom', bottom],
    ['left', left],
    ['right', right],
  ]
  for (const [key, value] of spaceEntries) {
    if (value !== undefined) {
      resolved[key] = resolveSpace(value)
    }
  }

  // RN/Tamagui `flex: n` semantics (grow n / shrink 1 / basis 0%), not the CSS
  // shorthand — matches how RNW and the legacy engine expanded it.
  if (flex !== undefined) {
    resolved['flexGrow'] = flex
    resolved['flexShrink'] = 1
    resolved['flexBasis'] = '0%'
  }

  const passthroughEntries: Array<[string, number | string | undefined]> = [
    ['flexDirection', flexDirection],
    ['alignItems', alignItems],
    ['justifyContent', justifyContent],
    ['alignSelf', alignSelf],
    ['position', position],
    ['display', display],
    ['overflow', overflow],
    ['opacity', opacity],
    ['cursor', cursor],
    ['pointerEvents', pointerEvents],
  ]
  for (const [key, value] of passthroughEntries) {
    if (value !== undefined) {
      resolved[key] = value
    }
  }

  if (
    shadowColor !== undefined ||
    shadowOffset !== undefined ||
    shadowOpacity !== undefined ||
    shadowRadius !== undefined
  ) {
    const color = resolveTooltipColor(colors, shadowColor) ?? 'rgba(0, 0, 0, 1)'
    resolved['boxShadow'] =
      `${shadowOffset?.width ?? 0}px ${shadowOffset?.height ?? 0}px ${shadowRadius ?? 0}px ${applyShadowAlpha(color, shadowOpacity)}`
  }

  resolveEdgeShorthands({ resolved, styleProps })

  return { ...resolved, ...styleProps['$platform-web'] } as CSSProperties
}

/** The box Tamagui's `View` contributed on web, as inline CSS (the compat reset + column flex). */
export const FRAME_BASE_STYLE: CSSProperties = {
  alignItems: 'stretch',
  boxSizing: 'border-box',
  display: 'flex',
  flexBasis: 'auto',
  flexDirection: 'column',
  flexShrink: 0,
  margin: 0,
  minHeight: 0,
  minWidth: 0,
  padding: 0,
  position: 'relative',
}

/**
 * Legacy `ContentInner` styled defaults as inline CSS. The legacy `$theme-dark` block
 * only zeroed the shadow offset/radius with no color/opacity, which Tamagui-web
 * emitted as NO box-shadow at all — so dark renders no shadow here either (pinned by
 * the tooltip parity matrix in packages/tailwind).
 */
export function contentFrameStyle({
  colors,
  isDarkMode,
}: {
  colors: UseSporeColorsReturn
  isDarkMode: boolean
}): CSSProperties {
  return {
    ...FRAME_BASE_STYLE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: TOOLTIP_CONTENT_GAP,
    backgroundColor: colors.surface1.val,
    borderColor: colors.surface3.val,
    borderRadius: TOOLTIP_CONTENT_BORDER_RADIUS,
    borderStyle: 'solid',
    borderWidth: TOOLTIP_BORDER_WIDTH,
    maxWidth: TOOLTIP_CONTENT_MAX_WIDTH,
    paddingBottom: TOOLTIP_CONTENT_PADDING,
    paddingLeft: TOOLTIP_CONTENT_PADDING,
    paddingRight: TOOLTIP_CONTENT_PADDING,
    paddingTop: TOOLTIP_CONTENT_PADDING,
    pointerEvents: 'none',
    outline: 'none',
    ...(isDarkMode ? undefined : { boxShadow: `0px 6px 12px ${applyShadowAlpha(colors.surface3.val, 0.04)}` }),
  }
}

const CONTENT_TRANSITION = 'transform 150ms ease-out, opacity 150ms ease-out'

const MOTION_TRANSFORMS: Record<TooltipAnimationDirection, string> = {
  left: `translateX(${TOOLTIP_ANIMATION_OFFSET}px)`,
  right: `translateX(${-TOOLTIP_ANIMATION_OFFSET}px)`,
  top: `translateY(${TOOLTIP_ANIMATION_OFFSET}px)`,
  bottom: `translateY(${-TOOLTIP_ANIMATION_OFFSET}px)`,
}

/**
 * Legacy enter/exit: opacity 0 with a 4px slide from the `animationDirection` side
 * (default 'top' → from below the resting position), driven by Base UI's transition
 * status. Timing is the fixed approximation of the Tamagui `simple` driver that the
 * tooltip-compat parity ledgered; transitions stay scoped to transform/opacity so
 * theme-token colors never flash on light/dark toggles.
 */
export function motionStyle(
  direction: TooltipAnimationDirection,
  transitionStatus: 'starting' | 'ending' | 'idle' | undefined,
): CSSProperties {
  const isHidden = transitionStatus === 'starting' || transitionStatus === 'ending'
  return {
    transition: CONTENT_TRANSITION,
    ...(isHidden ? { opacity: 0, transform: MOTION_TRANSFORMS[direction] } : undefined),
  }
}

export type ArrowSide = 'top' | 'bottom' | 'left' | 'right'

export function arrowSideOf(side: string): ArrowSide {
  switch (side) {
    case 'top':
    case 'bottom':
    case 'left':
    case 'right':
      return side
    case 'inline-start':
      return 'left'
    case 'inline-end':
      return 'right'
    default:
      return 'bottom'
  }
}

/**
 * The legacy 12px rotated-square arrow, two elements like the Tamagui `PopperArrow`:
 * the outer element (positioned by Base UI along the popup edge) is an overflow-hidden
 * clip window overlapping the popup border by 1px, and the inner rotated square
 * carries the background/border/shadow with the border on its two OUTER edges only —
 * so the tip merges with the popup body as one continuous shape (no seam, no floating
 * outlined square). Geometry ported from mycelium's tooltip-compat (INFRA-3021).
 */
const ARROW_WINDOW_LONG = TOOLTIP_ARROW_SIZE * 2
const ARROW_WINDOW_DEEP = TOOLTIP_ARROW_SIZE + TOOLTIP_BORDER_WIDTH

/** Per-side clip-window box: 2×size along the popup edge, size+1px deep (1px popup-border overlap). */
const ARROW_WINDOW_GEOMETRY: Record<ArrowSide, CSSProperties> = {
  top: { bottom: -TOOLTIP_ARROW_SIZE, height: ARROW_WINDOW_DEEP, width: ARROW_WINDOW_LONG },
  bottom: { top: -TOOLTIP_ARROW_SIZE, height: ARROW_WINDOW_DEEP, width: ARROW_WINDOW_LONG },
  left: { right: -TOOLTIP_ARROW_SIZE, height: ARROW_WINDOW_LONG, width: ARROW_WINDOW_DEEP },
  right: { left: -TOOLTIP_ARROW_SIZE, height: ARROW_WINDOW_LONG, width: ARROW_WINDOW_DEEP },
}

export function arrowWindowStyle(side: ArrowSide): CSSProperties {
  return { overflow: 'hidden', pointerEvents: 'none', ...ARROW_WINDOW_GEOMETRY[side] }
}

const ARROW_INNER_CENTERED = TOOLTIP_ARROW_SIZE / 2
const ARROW_INNER_OVERLAP = -(ARROW_INNER_CENTERED - TOOLTIP_BORDER_WIDTH)

/**
 * Per-side inner-square placement, centered on the long axis with its center row on the
 * popup border line, and the border drawn only on the tip's two OUTER edges (the same
 * per-side widths the legacy Tamagui `PopperArrow` sets).
 */
const ARROW_INNER_GEOMETRY: Record<ArrowSide, CSSProperties> = {
  top: {
    top: ARROW_INNER_OVERLAP,
    left: ARROW_INNER_CENTERED,
    borderRightWidth: TOOLTIP_BORDER_WIDTH,
    borderBottomWidth: TOOLTIP_BORDER_WIDTH,
  },
  bottom: {
    top: ARROW_INNER_CENTERED,
    left: ARROW_INNER_CENTERED,
    borderTopWidth: TOOLTIP_BORDER_WIDTH,
    borderLeftWidth: TOOLTIP_BORDER_WIDTH,
  },
  left: {
    top: ARROW_INNER_CENTERED,
    left: ARROW_INNER_OVERLAP,
    borderTopWidth: TOOLTIP_BORDER_WIDTH,
    borderRightWidth: TOOLTIP_BORDER_WIDTH,
  },
  right: {
    top: ARROW_INNER_CENTERED,
    left: ARROW_INNER_CENTERED,
    borderBottomWidth: TOOLTIP_BORDER_WIDTH,
    borderLeftWidth: TOOLTIP_BORDER_WIDTH,
  },
}

export function arrowInnerStyle({
  side,
  colors,
  isDarkMode,
}: {
  side: ArrowSide
  colors: UseSporeColorsReturn
  isDarkMode: boolean
}): CSSProperties {
  return {
    backgroundColor: colors.surface1.val,
    borderColor: colors.surface3.val,
    borderStyle: 'solid',
    borderWidth: 0,
    boxSizing: 'border-box',
    height: TOOLTIP_ARROW_SIZE,
    position: 'absolute',
    transform: 'rotate(45deg)',
    width: TOOLTIP_ARROW_SIZE,
    ...(isDarkMode ? undefined : { boxShadow: `0px 2px 8px ${applyShadowAlpha(colors.surface3.val, 0.12)}` }),
    ...ARROW_INNER_GEOMETRY[side],
  }
}
