import { isWebPlatform } from '@universe/environment'
import { useSporeColors } from '@universe/mycelium'
// Marker-only subpath, not the compat barrel: the barrel re-exports the web-only DOM
// wrapper (compat/index.ts -> ./dom) and this factory is in the native graph.
import { markIconGlyph } from '@universe/mycelium/compat/primitive-marker'
import { type UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import { createElement, forwardRef, useRef, useState } from 'react'
import { Svg, SvgProps } from 'react-native-svg'
import { withAnimated } from 'ui/src/components/factories/animated'
import { toDomElement, useActiveMediaStyles, useGroupHover } from 'ui/src/components/factories/iconHooks'
import {
  ICON_SIZE_TOKEN_PX,
  IconColorToken,
  IS_WEB_STYLE_TARGET,
  resolveIconColor,
  resolveIconDimension,
  resolveIconStyleProps,
} from 'ui/src/components/factories/iconTokens'
import {
  IconDynamicColor,
  IconGroupPseudoProps,
  IconMediaProps,
  IconOverrideStyle,
  IconStyleOverlay,
} from 'ui/src/components/factories/iconTypes'
import { IconSizeTokens } from 'ui/src/theme'

// Re-exported so the emitted declarations of the ~294 generated icons can name every part of IconProps
export type {
  IconColorValue,
  IconDimensionValue,
  IconDynamicColor,
  IconGroupPseudoProps,
  IconMediaProps,
  IconOverrideStyle,
  IconStyleOverlay,
} from 'ui/src/components/factories/iconTypes'

type SvgPropsWithRef = SvgProps & { ref: React.ForwardedRef<Svg>; style?: { color?: string } }

/**
 * Every prop shared between react-native-svg's and React DOM's SVG surfaces widened to accept
 * both flavors. Cross-system assignability (INFRA-3314 acceptance criterion): a ui icon value
 * must typecheck where `@universe/mycelium/icons`' DOM-typed `GeneratedIcon` is expected, so the
 * DOM-flavored prop types (event handlers, `aria-*` Booleanish strings) must be accepted here.
 * Honest per platform: on web the rnsvg-web/react-native-web layer delivers DOM-flavored events
 * and values; on native only the RN flavor occurs.
 */
type WithDomSvgFlavor<RNProps> = {
  [K in keyof RNProps]: K extends keyof React.SVGProps<SVGSVGElement>
    ? RNProps[K] | React.SVGProps<SVGSVGElement>[K]
    : RNProps[K]
}

/**
 * Mirrors `@tamagui/helpers-icon`'s `NonStyleProps`: the react-native-svg props minus the keys the
 * style overlay owns (those resolved through the style channel before, and still do), keeping
 * `disableTheme` and the loose `style` — with `style` also accepting the DOM `CSSProperties`
 * flavor (the runtime merges plain objects on every dialect).
 */
export type IconSvgProps = WithDomSvgFlavor<
  Omit<SvgProps, 'color' | 'width' | 'height' | 'opacity' | 'transform' | 'scale' | 'fontSize' | 'fontWeight' | 'style'>
> & {
  disableTheme?: boolean
  style?: SvgProps['style'] | React.CSSProperties
}

export type IconProps = IconSvgProps &
  IconStyleOverlay &
  IconMediaProps &
  IconGroupPseudoProps & {
    size?: IconSizeTokens | number | { width: number; height: number }
    // we need the string & {} to allow strings but not lose the intellisense autocomplete
    color?: (IconColorToken | (string & {})) | IconDynamicColor | null
    strokeWidth?: number | `$${string}` | (string & {})
    Component?: React.FunctionComponent<SvgPropsWithRef>
    animation?: string | null
    animateOnly?: readonly string[]
    hoverStyle?: IconOverrideStyle
    // pressStyle/focusStyle (and the $group-*-press/-focus keys) are typed for byte-compat but
    // deliberately inert, like `animation`: no icon call site in the repo passes them (censused),
    // and the old factory wired no press/focus events on the Svg either
    pressStyle?: IconOverrideStyle
    focusStyle?: IconOverrideStyle
  }

export type GeneratedIconProps = IconProps & { hoverColor?: IconProps['color'] }
/**
 * The ref target is platform-dependent and typed as the honest union (INFRA-3314 cross-system
 * assignability): on native the react-native-svg `Svg` instance, on the web style target the
 * rendered `SVGSVGElement` (unwrapped from react-native-svg's web handle) — which is exactly what
 * a converted receiver typed with `@universe/mycelium/icons`' DOM-flavored `GeneratedIcon` expects.
 */
export type GeneratedIcon = React.ForwardRefExoticComponent<
  GeneratedIconProps & React.RefAttributes<Svg | SVGSVGElement>
>

/**
 * Props the factory consumes itself instead of forwarding: the icon contract (size/color/etc.),
 * the media/group/pseudo blocks, and the props that are deliberately inert: the Tamagui-era
 * animation props (inert on plain SVGs before too) and the press/focus pseudo legs
 * (`pressStyle`/`focusStyle`, `$group-*-press`/`-focus`) — zero icon call sites repo-wide, and the
 * old factory attached no press/focus event wiring to the Svg either; only the hover legs are live.
 */
const CONSUMED_PROP_KEYS: Record<string, true> = {
  color: true,
  hoverColor: true,
  size: true,
  width: true,
  height: true,
  style: true,
  Component: true,
  animation: true,
  animateOnly: true,
  disableTheme: true,
  hoverStyle: true,
  pressStyle: true,
  focusStyle: true,
  '$group-hover': true,
  '$group-press': true,
  '$group-focus': true,
  '$group-item-hover': true,
  '$group-item-press': true,
  '$group-item-focus': true,
  '$group-card-hover': true,
  '$group-card-press': true,
  '$group-card-focus': true,
  $xxs: true,
  $xs: true,
  $sm: true,
  $md: true,
  $lg: true,
  $xl: true,
  $xxl: true,
  $xxxl: true,
  $short: true,
  $midHeight: true,
  $lgHeight: true,
}

/** Matches the old Tamagui `View` wrapper's web rendering (RNW flex-compat defaults) so layouts don't shift. */
const HOVER_WRAPPER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  flexDirection: 'column',
  flexBasis: 'auto',
  boxSizing: 'border-box',
  position: 'relative',
  minHeight: 0,
  minWidth: 0,
  flexShrink: 0,
}

/**
 * Off-state values Tamagui synthesized into the base style for properties a pseudo style (e.g.
 * `hoverStyle={{ opacity: 0.5 }}`) animates, so CSS transitions have a starting value.
 */
const PSEUDO_BASE_DEFAULTS: Record<string, unknown> = {
  opacity: 1,
  scale: 1,
}

function resolveSizePx(size: IconSizeTokens | number | { width: number; height: number }): {
  width: number | string
  height: number | string
} {
  if (typeof size === 'number') {
    return { width: size, height: size }
  }
  if (typeof size === 'string') {
    // unknown tokens render raw, the same fail-visible behavior the Tamagui resolver had
    const px: number | string = (ICON_SIZE_TOKEN_PX as Record<string, number>)[size] ?? size
    return { width: px, height: px }
  }
  return { width: size.width, height: size.height }
}

interface OverrideAccumulator {
  size?: IconSizeTokens | number | { width: number; height: number }
  color?: unknown
}

function applyOverride(args: {
  override: IconOverrideStyle
  styleBag: Record<string, unknown>
  acc: OverrideAccumulator
}): void {
  const { override, styleBag, acc } = args
  for (const key of Object.keys(override)) {
    const value = (override as Record<string, unknown>)[key]
    if (value === undefined) {
      continue
    }
    if (key === 'size') {
      acc.size = value as IconSizeTokens | number | { width: number; height: number }
    } else if (key === 'color') {
      acc.color = value
    } else {
      styleBag[key] = value
    }
  }
}

interface ResolvedRender {
  passthrough: Record<string, unknown>
  style: Record<string, unknown>
}

/**
 * Base bag: same defaults the old factory fed usePropsAndStyle, plus — like Tamagui — the
 * synthesized off-state base for props a `hoverStyle` animates, so transitions have a start value.
 */
function collectStyleBag(
  propsIn: Record<string, unknown>,
  hoverStylePseudo: IconOverrideStyle | undefined,
): Record<string, unknown> {
  const styleBag: Record<string, unknown> = { strokeWidth: 8 }
  for (const key of Object.keys(propsIn)) {
    if (key === 'hoverStyle' && hoverStylePseudo) {
      for (const pseudoKey of Object.keys(hoverStylePseudo)) {
        if (
          styleBag[pseudoKey] === undefined &&
          propsIn[pseudoKey] === undefined &&
          PSEUDO_BASE_DEFAULTS[pseudoKey] !== undefined
        ) {
          styleBag[pseudoKey] = PSEUDO_BASE_DEFAULTS[pseudoKey]
        }
      }
      continue
    }
    if (CONSUMED_PROP_KEYS[key] !== true) {
      styleBag[key] = propsIn[key]
    }
  }
  return styleBag
}

/**
 * Reassemble in the old resolver's declaration order — width, height, other styles, color,
 * transform — so DOM snapshots serialize identically.
 */
function orderResolvedStyle(args: {
  style: Record<string, unknown>
  width: unknown
  height: unknown
  resolvedColor: unknown
}): Record<string, unknown> {
  const { style, width, height, resolvedColor } = args
  const orderedStyle: Record<string, unknown> = { width, height }
  for (const key of Object.keys(style)) {
    if (key !== 'transform') {
      orderedStyle[key] = style[key]
    }
  }
  if (resolvedColor !== undefined && resolvedColor !== null) {
    orderedStyle['color'] = resolvedColor
  }
  const transformValue = style['transform']
  if (transformValue !== undefined) {
    orderedStyle['transform'] = transformValue
  }
  return orderedStyle
}

/**
 * RN's `StyleProp` array form (nested arrays, falsy entries) flattened to one object. Both
 * dialects need it flat: the old pipeline merged the style prop into its single resolved style
 * object on every platform, spreading an array here would mangle it into indexed keys, and on
 * web React DOM throws "Failed to set an indexed property [0] on 'CSSStyleDeclaration'".
 */
function flattenStyleProp(styleProp: unknown): unknown {
  if (!Array.isArray(styleProp)) {
    return styleProp
  }
  const flat: Record<string, unknown> = {}
  for (const entry of styleProp) {
    const flatEntry = flattenStyleProp(entry)
    if (flatEntry !== null && typeof flatEntry === 'object') {
      Object.assign(flat, flatEntry)
    }
  }
  return flat
}

/** The caller's own style wins, like the old style-prop merge order. */
function mergeConsumerStyle(orderedStyle: Record<string, unknown>, styleProp: unknown): Record<string, unknown> {
  const flattenedStyleProp = flattenStyleProp(styleProp)
  return flattenedStyleProp === undefined || flattenedStyleProp === null
    ? orderedStyle
    : { ...orderedStyle, ...(flattenedStyleProp as Record<string, unknown>) }
}

/**
 * The render-time equivalent of the old `usePropsAndStyle(…, { resolveValues: 'value' })` call:
 * merge defaults, active media styles, hovered group styles, and the element's own hoverStyle
 * (base < media < group < self pseudo), then split into SVG passthrough props and a resolved
 * inline style.
 */
function buildRender(args: {
  allProps: GeneratedIconProps
  activeMediaStyles: IconOverrideStyle[]
  groupStyles: { any?: IconOverrideStyle; item?: IconOverrideStyle; card?: IconOverrideStyle }
  groupHovered: { any: boolean; item: boolean; card: boolean }
  hover: boolean
  selfHover: boolean
  onSelfHoverChange: (hovered: boolean) => void
  defaultFill: string | undefined
  colors: UseSporeColorsReturn
}): ResolvedRender {
  const {
    allProps,
    activeMediaStyles,
    groupStyles,
    groupHovered,
    hover,
    selfHover,
    onSelfHoverChange,
    defaultFill,
    colors,
  } = args
  const propsIn = allProps as Record<string, unknown>
  const hoverStylePseudo = IS_WEB_STYLE_TARGET ? allProps.hoverStyle : undefined

  const styleBag = collectStyleBag(propsIn, hoverStylePseudo)

  const acc: OverrideAccumulator = { size: allProps.size, color: allProps.color }
  for (const mediaStyle of activeMediaStyles) {
    applyOverride({ override: mediaStyle, styleBag, acc })
  }
  for (const name of ['any', 'item', 'card'] as const) {
    const groupStyle = groupStyles[name]
    if (groupHovered[name] && groupStyle) {
      applyOverride({ override: groupStyle, styleBag, acc })
    }
  }
  if (selfHover && hoverStylePseudo) {
    applyOverride({ override: hoverStylePseudo, styleBag, acc })
  }

  const renderColor = acc.color ?? defaultFill ?? (isWebPlatform ? 'currentColor' : undefined)
  const hoverColor = allProps.hoverColor ?? renderColor
  const effectiveColor = hover ? hoverColor : renderColor

  // width/height are type-omitted but still arrive untyped (ThemedIcon's cloneElement); each set
  // axis beats the resolved size on that axis, matching the old style-channel precedence
  const widthOverride = styleBag['width'] !== undefined ? styleBag['width'] : propsIn['width']
  const heightOverride = styleBag['height'] !== undefined ? styleBag['height'] : propsIn['height']
  delete styleBag['width']
  delete styleBag['height']

  const { passthrough, style } = resolveIconStyleProps(styleBag, { themeColors: colors, isWeb: IS_WEB_STYLE_TARGET })

  // The old resolver emitted `testID` as `data-testid` on the web target (queryByTestId relies on it)
  if (IS_WEB_STYLE_TARGET && passthrough['testID'] !== undefined && passthrough['data-testid'] === undefined) {
    passthrough['data-testid'] = passthrough['testID']
    delete passthrough['testID']
  }

  // hoverStyle rides the element's own hover, like the old pseudo handling (web only — no native hover)
  if (hoverStylePseudo) {
    const consumerEnter = passthrough['onMouseEnter'] as ((event: unknown) => void) | undefined
    const consumerLeave = passthrough['onMouseLeave'] as ((event: unknown) => void) | undefined
    passthrough['onMouseEnter'] = (event: unknown): void => {
      consumerEnter?.(event)
      onSelfHoverChange(true)
    }
    passthrough['onMouseLeave'] = (event: unknown): void => {
      consumerLeave?.(event)
      onSelfHoverChange(false)
    }
  }

  const sizePx = resolveSizePx(acc.size ?? '$icon.8')
  const orderedStyle = orderResolvedStyle({
    style,
    width: resolveIconDimension(widthOverride) ?? sizePx.width,
    height: resolveIconDimension(heightOverride) ?? sizePx.height,
    resolvedColor: resolveIconColor(effectiveColor, colors),
  })

  return { passthrough, style: mergeConsumerStyle(orderedStyle, allProps.style) }
}

export function createIcon({
  name,
  getIcon,
  defaultFill,
}: {
  name: string
  getIcon: (props: SvgPropsWithRef) => JSX.Element
  defaultFill?: string
}): readonly [GeneratedIcon, GeneratedIcon] {
  const Icon = forwardRef<Svg | SVGSVGElement, GeneratedIconProps>((allProps, ref) => {
    const [hover, setHover] = useState(false)
    const [selfHover, setSelfHover] = useState(false)
    const colors = useSporeColors()
    const domNodeRef = useRef<Element | null>(null)

    const groupStyles = {
      any: allProps['$group-hover'],
      item: allProps['$group-item-hover'],
      card: allProps['$group-card-hover'],
    }
    const groupHovered = useGroupHover({
      domNodeRef,
      hasAnyGroupStyle: isWebPlatform && groupStyles.any != null,
      hasItemGroupStyle: isWebPlatform && groupStyles.item != null,
      hasCardGroupStyle: isWebPlatform && groupStyles.card != null,
    })
    const activeMediaStyles = useActiveMediaStyles(allProps as Record<string, unknown>)

    const { passthrough, style } = buildRender({
      allProps,
      activeMediaStyles,
      groupStyles,
      groupHovered,
      hover,
      selfHover,
      onSelfHoverChange: setSelfHover,
      defaultFill,
      colors,
    })

    const setRefs = (instance: Svg | null): void => {
      const domElement = toDomElement(instance)
      domNodeRef.current = domElement
      // Honest ref target per platform (see GeneratedIcon): the rendered DOM element on the web
      // style target (react-native-svg's web handle unwrapped — what DOM-typed receivers expect),
      // the Svg instance on native. No icon call site attaches a ref today (censused).
      const forwarded = IS_WEB_STYLE_TARGET ? ((domElement as SVGSVGElement | null) ?? instance) : instance
      if (typeof ref === 'function') {
        ref(forwarded)
      } else if (ref) {
        ref.current = forwarded
      }
    }

    const svgProps = {
      ref: setRefs,
      ...passthrough,
      style,
    } as unknown as SvgPropsWithRef

    const Component = allProps.Component
    const comp = Component ? createElement(Component, svgProps) : getIcon(svgProps)

    // Only enabled on web because mobile doesn't support hover events
    // It is also optional because it breaks some layouts
    if (isWebPlatform && allProps.hoverColor) {
      return (
        // oxlint-disable-next-line react/forbid-elements -- Tamagui-free replacement for the old Tamagui View hover wrapper; Flex would reintroduce Tamagui
        <div style={HOVER_WRAPPER_STYLE} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          {comp}
        </div>
      )
    }

    return comp
  })

  Icon.displayName = name
  // The size default rides inline style, beating a container's `[&_svg]:size-*` class;
  // consumers needing a concrete box gate their clone on this marker.
  markIconGlyph(Icon)

  const IconPlain = forwardRef<Svg, IconProps>((props, ref) => {
    // Flatten style array on web - Animated.createAnimatedComponent may wrap styles in an array
    // which causes React DOM to throw: "Failed to set an indexed property [0] on 'CSSStyleDeclaration'".
    // Deliberately web-only here, matching the old leg: on-device reanimated hands RN-legal style
    // arrays straight to the Svg and flattening them is not ours to do.
    const { style, ...rest } = props as SvgPropsWithRef
    const flatStyle = isWebPlatform ? flattenStyleProp(style) : style

    return getIcon({
      // oxlint-disable-next-line typescript/no-explicit-any -- Type casting needed for complex SVG prop types
      ...(rest as any),
      style: flatStyle,
      ref,
    })
  })

  IconPlain.displayName = name

  const AnimatedIconPlain = withAnimated(IconPlain)

  const AnimatedIcon = forwardRef<Svg | SVGSVGElement, IconProps>((props: IconProps, ref) => (
    // oxlint-disable-next-line typescript/no-explicit-any -- AnimatedIconPlain requires any cast for compatibility
    <Icon ref={ref} {...props} Component={AnimatedIconPlain as any} />
  ))

  AnimatedIcon.displayName = `Animated${name}`
  markIconGlyph(AnimatedIcon)

  return [Icon, AnimatedIcon] as const
}
