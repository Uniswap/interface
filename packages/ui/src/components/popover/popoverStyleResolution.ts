import { type UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import type { CSSProperties } from 'react'
import type { PopoverFrameStyleProps } from 'ui/src/components/popover/types'
import { borderRadii, spacing, zIndexes } from 'ui/src/theme'
import { gap, padding } from 'ui/src/theme/spacing'

/** All three space-token families call sites use (`$spacing*`, `$padding*`, `$gap*`). */
const SPACE_TOKENS: Record<string, number> = { ...spacing, ...padding, ...gap }

/**
 * Token → concrete-value resolution for the rebuilt Popover (INFRA-3318): the
 * legacy Tamagui stack props call sites pass to the Popover parts, resolved to
 * plain inline styles (no class emission — INFRA-3285 keeps `packages/ui` out of
 * every Tailwind `@source` scan). Follows the Input/Tooltip rebuilds' resolver
 * conventions (theme colors via useSporeColors, `var(--<themeKey>)` unwrapping);
 * extends them with the native output mode the Popover's real native leg needs.
 */

function resolveSpace(value: number | string | undefined): number | string | undefined {
  if (typeof value !== 'string' || !value.startsWith('$')) {
    return value
  }
  const token = value.slice(1)
  if (token in SPACE_TOKENS) {
    return SPACE_TOKENS[token]
  }
  return value
}

function resolveRadius(value: number | string | undefined): number | string | undefined {
  if (typeof value !== 'string' || !value.startsWith('$')) {
    // Non-token strings ("50%") pass through instead of indexing borderRadii with a bad key.
    return value
  }
  return borderRadii[value.slice(1) as keyof typeof borderRadii]
}

/** `$`-token or plain number into the `zIndexes` scale (PortfolioHeader passes `zIndex="$default"`). */
export function resolvePopoverZIndex(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' || value === undefined) {
    return value
  }
  const key = value.startsWith('$') ? value.slice(1) : value
  const resolved = (zIndexes as Record<string, number | undefined>)[key]
  return resolved
}

/**
 * `$<themeKey>` tokens and Tamagui-delivered `var(--<themeKey>)` references resolve to
 * the live theme value (the Input rebuild's resolver pattern — deterministic in any DOM
 * and independent of Tamagui's injected CSS variables surviving the migration); other
 * strings ('transparent', hex, rgba) pass through.
 */
export function resolvePopoverColor(colors: UseSporeColorsReturn, value: string | undefined): string | undefined {
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

type EdgeShorthandValues = {
  all?: number | string
  horizontal?: number | string
  vertical?: number | string
  left?: number | string
  right?: number | string
  top?: number | string
  bottom?: number | string
}

/** Expand one legacy margin/padding shorthand family into the four concrete edges. */
function resolveEdgeShorthands({
  resolved,
  property,
  values,
}: {
  resolved: Record<string, unknown>
  property: 'margin' | 'padding'
  values: EdgeShorthandValues
}): void {
  const edges: Array<['Top' | 'Bottom' | 'Left' | 'Right', number | string | undefined]> = [
    ['Top', values.top ?? values.vertical ?? values.all],
    ['Bottom', values.bottom ?? values.vertical ?? values.all],
    ['Left', values.left ?? values.horizontal ?? values.all],
    ['Right', values.right ?? values.horizontal ?? values.all],
  ]
  for (const [edge, value] of edges) {
    if (value !== undefined) {
      resolved[`${property}${edge}`] = resolveSpace(value)
    }
  }
}

/**
 * Resolve one Popover style-prop bag into a flat style record: theme/spacing/radius
 * tokens replaced by concrete values, spacing shorthands expanded, and shadows folded
 * per platform (`web` → `boxShadow` string like RNW; `native` → RN `shadow*` props).
 * `$platform-web` merges last on web and is dropped on native.
 */
interface ResolveArgs {
  colors: UseSporeColorsReturn
  styleProps: PopoverFrameStyleProps
  platform: 'web' | 'native'
  resolved: Record<string, unknown>
}

function resolveVisualProps({ colors, styleProps, platform, resolved }: ResolveArgs): void {
  const resolvedBackground = styleProps.backgroundColor ?? styleProps.background
  if (resolvedBackground !== undefined) {
    resolved['backgroundColor'] = resolvePopoverColor(colors, resolvedBackground)
  }
  if (styleProps.borderColor !== undefined) {
    resolved['borderColor'] = resolvePopoverColor(colors, styleProps.borderColor)
  }
  if (styleProps.borderWidth !== undefined) {
    resolved['borderWidth'] = resolveSpace(styleProps.borderWidth)
    if (platform === 'web') {
      resolved['borderStyle'] = 'solid'
    }
  }
  if (styleProps.borderRadius !== undefined) {
    resolved['borderRadius'] = resolveRadius(styleProps.borderRadius)
  }
}

function resolveLayoutProps({ styleProps, platform, resolved }: ResolveArgs): void {
  const spaceEntries: Array<[string, number | string | undefined]> = [
    ['width', styleProps.width],
    ['height', styleProps.height],
    ['minWidth', styleProps.minWidth],
    ['minHeight', styleProps.minHeight],
    ['maxWidth', styleProps.maxWidth],
    ['maxHeight', styleProps.maxHeight],
    ['gap', styleProps.gap],
    ['rowGap', styleProps.rowGap],
    ['columnGap', styleProps.columnGap],
    ['top', styleProps.top],
    ['bottom', styleProps.bottom],
    ['left', styleProps.left],
    ['right', styleProps.right],
  ]
  for (const [key, value] of spaceEntries) {
    if (value !== undefined) {
      resolved[key] = resolveSpace(value)
    }
  }

  // RN/Tamagui `flex: n` semantics (grow n / shrink 1 / basis 0%), not the CSS
  // shorthand — matches how RNW and the legacy engine expanded it.
  if (styleProps.flex !== undefined) {
    if (platform === 'web') {
      resolved['flexGrow'] = styleProps.flex
      resolved['flexShrink'] = 1
      resolved['flexBasis'] = '0%'
    } else {
      resolved['flex'] = styleProps.flex
    }
  }

  const passthroughEntries: Array<[string, unknown]> = [
    ['flexDirection', styleProps.flexDirection],
    ['alignItems', styleProps.alignItems],
    ['justifyContent', styleProps.justifyContent],
    ['alignSelf', styleProps.alignSelf],
    ['position', styleProps.position],
    ['overflow', styleProps.overflow],
    ['opacity', styleProps.opacity],
    ['pointerEvents', styleProps.pointerEvents],
    ...(platform === 'web'
      ? ([
          ['display', styleProps.display],
          ['cursor', styleProps.cursor],
        ] as Array<[string, unknown]>)
      : []),
  ]
  for (const [key, value] of passthroughEntries) {
    if (value !== undefined) {
      resolved[key] = value
    }
  }
}

/**
 * Narrow the loose (`unknown`) shadow-prop values legacy call sites deliver —
 * strings, `useShadowProps*()` spreads carrying Tamagui `Variable` objects
 * (`{ val }`), or nothing usable.
 */
function toColorInput(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value
  }
  if (value !== null && typeof value === 'object' && 'val' in value) {
    const val = (value as { val: unknown }).val
    return typeof val === 'string' || typeof val === 'number' ? String(val) : undefined
  }
  return undefined
}

function toShadowOffset(value: unknown): { width: number; height: number } | undefined {
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { width?: unknown }).width === 'number' &&
    typeof (value as { height?: unknown }).height === 'number'
  ) {
    return value as { width: number; height: number }
  }
  return undefined
}

function resolveShadowProps({ colors, styleProps, platform, resolved }: ResolveArgs): void {
  const hasShadow =
    styleProps.shadowColor !== undefined ||
    styleProps.shadowOffset !== undefined ||
    styleProps.shadowOpacity !== undefined ||
    styleProps.shadowRadius !== undefined
  if (!hasShadow) {
    return
  }
  const shadowOffset = toShadowOffset(styleProps.shadowOffset)
  const shadowOpacity = typeof styleProps.shadowOpacity === 'number' ? styleProps.shadowOpacity : undefined
  const shadowRadius = typeof styleProps.shadowRadius === 'number' ? styleProps.shadowRadius : undefined
  const color = resolvePopoverColor(colors, toColorInput(styleProps.shadowColor)) ?? 'rgba(0, 0, 0, 1)'
  if (platform === 'web') {
    resolved['boxShadow'] =
      `${shadowOffset?.width ?? 0}px ${shadowOffset?.height ?? 0}px ${shadowRadius ?? 0}px ${applyShadowAlpha(color, shadowOpacity)}`
    return
  }
  resolved['shadowColor'] = color
  if (shadowOffset !== undefined) {
    resolved['shadowOffset'] = shadowOffset
  }
  if (shadowOpacity !== undefined) {
    resolved['shadowOpacity'] = shadowOpacity
  }
  if (shadowRadius !== undefined) {
    resolved['shadowRadius'] = shadowRadius
  }
}

export function resolvePopoverStyleProps({
  colors,
  styleProps,
  platform = 'web',
}: {
  colors: UseSporeColorsReturn
  styleProps: PopoverFrameStyleProps
  platform?: 'web' | 'native'
}): Record<string, unknown> {
  const resolved: Record<string, unknown> = {}
  const args: ResolveArgs = { colors, styleProps, platform, resolved }

  resolveVisualProps(args)
  resolveLayoutProps(args)
  resolveShadowProps(args)

  resolveEdgeShorthands({
    resolved,
    property: 'margin',
    values: {
      all: styleProps.m ?? styleProps.margin,
      horizontal: styleProps.mx ?? styleProps.marginHorizontal,
      vertical: styleProps.my ?? styleProps.marginVertical,
      left: styleProps.ml ?? styleProps.marginLeft,
      right: styleProps.mr ?? styleProps.marginRight,
      top: styleProps.mt ?? styleProps.marginTop,
      bottom: styleProps.mb ?? styleProps.marginBottom,
    },
  })
  resolveEdgeShorthands({
    resolved,
    property: 'padding',
    values: {
      all: styleProps.p ?? styleProps.padding,
      horizontal: styleProps.px ?? styleProps.paddingHorizontal,
      vertical: styleProps.py ?? styleProps.paddingVertical,
      left: styleProps.pl ?? styleProps.paddingLeft,
      right: styleProps.pr ?? styleProps.paddingRight,
      top: styleProps.pt ?? styleProps.paddingTop,
      bottom: styleProps.pb ?? styleProps.paddingBottom,
    },
  })

  if (platform === 'web') {
    return { ...resolved, ...styleProps['$platform-web'] }
  }
  return resolved
}

/** Web convenience wrapper typed as inline CSS. */
export function resolvePopoverWebStyle(
  colors: UseSporeColorsReturn,
  styleProps: PopoverFrameStyleProps,
): CSSProperties {
  return resolvePopoverStyleProps({ colors, styleProps, platform: 'web' }) as CSSProperties
}
