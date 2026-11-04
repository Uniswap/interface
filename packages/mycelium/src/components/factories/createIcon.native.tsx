/**
 * Native leg of the mycelium icon factory (INFRA-3508): the same call shape
 * and prop surface as the web leg, rendered through react-native-svg (an
 * optional peer with a pinned devDependency — the Shimmer mechanism).
 *
 * Styling story: every supported style prop resolves to a plain RN
 * inline-style value on the root `Svg` — theme-aware LITERAL colors via the
 * compat `useSporeColors` native leg (uniwind's runtime theme; CSS variables
 * do not exist on device), numeric px sizes, RN transform arrays. `$xs`/`$sm`
 * media pools apply Dimensions-driven, like the legacy factory; `$group-*`
 * pools are inert (no hover/press/focus fires on device — legacy parity);
 * `className` has no uniwind story on react-native-svg components and is
 * dropped. An unknown `$` colour token logs one error, emits no colour (both
 * legs decide through the one resolver in `compat/diagnostics.ts`); every other
 * unknown token still throws, the web lane's fail-closed posture.
 *
 * Explicit `.native` imports where a suffix-less specifier would resolve the
 * web leg under web-first test resolvers (the INFRA-3516 lesson).
 */
import * as React from 'react'
import { forwardRef, useCallback, useSyncExternalStore } from 'react'
import { Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import type { Svg } from 'react-native-svg'
import {
  applyIconNativeLane,
  resolveIconColorNative,
  resolveNativePools,
  type IconNativeStyle,
} from '../../compat/icon-native-style'
import { partitionIconProps } from '../../compat/icon-prop-partition'
import { DEFAULT_ICON_SIZE, iconSizeAxes, resolveIconStrokeWidth } from '../../compat/icon-props'
import { markMyceliumIcon, markMyceliumPrimitive } from '../../compat/primitive-marker'
import { BREAKPOINT_PX, HEIGHT_BREAKPOINT_PX } from '../../theme-hooks-compat/tokens'
import { useSporeColors } from '../../theme-hooks-compat/useSporeColors.native'
import type { GeneratedIcon, GeneratedIconProps, SvgPropsWithRef } from './createIcon'

export type { GeneratedIcon, GeneratedIconProps, IconProps, SvgPropsWithRef } from './createIcon'

function getWindowSizeSnapshot(): string {
  const { width, height } = Dimensions.get('window')
  return `${width}x${height}`
}

/**
 * Active media breakpoints, Dimensions-driven (max-width/max-height,
 * desktop-first — `ui/src/theme/media.ts` semantics via the compat breakpoint
 * tables). Subscribes only when media pools are present, so plain icons pay
 * nothing — the legacy `useActiveMediaStyles` contract.
 */
function useActiveMediaState(hasMediaPools: boolean): Record<string, boolean> | undefined {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!hasMediaPools) {
        return (): void => undefined
      }
      const subscription = Dimensions.addEventListener('change', onStoreChange)
      return (): void => subscription.remove()
    },
    [hasMediaPools],
  )
  const windowSize = useSyncExternalStore(subscribe, getWindowSizeSnapshot, getWindowSizeSnapshot)

  if (!hasMediaPools) {
    return undefined
  }
  const [width = 0, height = 0] = windowSize.split('x').map(Number)
  const state: Record<string, boolean> = {}
  for (const [key, maxWidth] of Object.entries(BREAKPOINT_PX)) {
    state[key] = width <= maxWidth
  }
  for (const [key, maxHeight] of Object.entries(HEIGHT_BREAKPOINT_PX)) {
    state[key] = height <= maxHeight
  }
  return state
}

export function createIcon({
  name,
  getIcon,
  defaultFill,
}: {
  name: string
  getIcon: (props: SvgPropsWithRef) => React.ReactElement
  defaultFill?: string
}): readonly [GeneratedIcon, GeneratedIcon] {
  const Icon = forwardRef<Svg | SVGSVGElement, GeneratedIconProps>(function IconComponent(props, ref) {
    // `hoverColor` (web-only own-hover swap, INFRA-3320) has no device
    // equivalent — no `:hover` on a touch surface — so it is discarded here
    // exactly like the `$group-hover` pool below, instead of leaking into
    // `passthrough` as an unrecognized prop on the Svg host.
    // `onPress` is NOT pulled out here (unlike `testID`): react-native-svg's
    // `Svg` already declares a real `onPress`, so it rides the shared
    // partition's passthrough channel straight onto the host component.
    const {
      size,
      color,
      hoverColor: _hoverColor,
      strokeWidth = 8,
      fill,
      style,
      className: _className,
      testID,
      ...rest
    } = props

    // Shared partition (compat/icon-props.ts): CSS lane / `$` pools /
    // ledger-rejected (dev throw, prod drop) / SVG passthrough.
    const { cssLane, pools, passthrough } = partitionIconProps(rest as Record<string, unknown>)

    const colors = useSporeColors()
    const activeMedia = useActiveMediaState(pools !== undefined)

    // Legacy native default: NO `currentColor` fallback on device — an
    // unset color leaves the style channel alone (children still reference
    // currentColor, which react-native-svg resolves against the inherited
    // color context, exactly like the legacy factory).
    const baseColor = color ?? defaultFill

    const resolved =
      pools === undefined
        ? { cssLane, size, color: baseColor }
        : resolveNativePools({ pools, cssLane, size, color: baseColor, colors, activeMedia: activeMedia ?? {} })

    const svgStyle: IconNativeStyle = {}
    if (resolved.color !== undefined && resolved.color !== null) {
      // `undefined` is the unmapped-token drop (logged, not thrown). Leaving
      // the style channel alone is the documented legacy native default for an
      // unset colour, so the glyph resolves currentColor from its context.
      const resolvedColor = resolveIconColorNative(resolved.color, colors)
      if (resolvedColor !== undefined) {
        svgStyle.color = resolvedColor
      }
    }
    const axes = iconSizeAxes(resolved.size ?? DEFAULT_ICON_SIZE)
    svgStyle.width = axes.width
    svgStyle.height = axes.height
    if (fill !== undefined) {
      // Style channel like the web leg: react-native-svg merges fill/stroke
      // from style into the paint props, so the channel invariant holds.
      const resolvedFill = resolveIconColorNative(fill, colors)
      if (resolvedFill !== undefined) {
        svgStyle.fill = resolvedFill
      }
    }
    // Native lane last: an explicit width/height beats the resolved size on
    // that axis, riding the same style channel as everything else.
    applyIconNativeLane(resolved.cssLane, svgStyle)

    return getIcon({
      strokeWidth: resolveIconStrokeWidth(strokeWidth),
      ...passthrough,
      // The caller's own style wins; RN flattens nested style arrays
      // natively, so the RN flavor of the widened `style` union (arrays
      // included) passes through untouched.
      style: style === undefined || style === null ? svgStyle : [svgStyle, style],
      // The real RN prop name (INFRA-2962) — react-native-svg's `Svg` accepts
      // it like any other host component, no dialect conversion needed.
      testID,
      ref,
    } as unknown as SvgPropsWithRef)
  })
  Icon.displayName = name
  // Same opt-out as the web leg: legacy wrappers must not clone injected
  // legacy color tokens onto mycelium output (compat/primitive-marker.ts).
  markMyceliumPrimitive(Icon)
  // Also stamps the narrower glyph-only marker for consumers that need to
  // recognize a glyph specifically, not any marked compat primitive.
  markMyceliumIcon(Icon)

  /**
   * The `Animated<Name>` twin, legacy-shaped: reanimated's
   * `createAnimatedComponent` over a class wrapper (reanimated needs a class
   * or forwardRef target),
   * so `entering`/`exiting`/`layout` animate on device like the legacy twins.
   */
  class WithAnimated extends React.Component<GeneratedIconProps> {
    static displayName = `WithAnimated(${name})`

    override render(): React.ReactNode {
      return <Icon {...this.props} />
    }
  }
  const AnimatedIcon = Animated.createAnimatedComponent(
    WithAnimated as unknown as React.ComponentClass<GeneratedIconProps>,
  ) as unknown as GeneratedIcon
  markMyceliumPrimitive(AnimatedIcon)
  markMyceliumIcon(AnimatedIcon)

  return [Icon, AnimatedIcon] as const
}
