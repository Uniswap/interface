/**
 * Native leg of the `LinearGradient` compat: the same structure
 * the legacy `@tamagui/linear-gradient` renders on device — a stack frame
 * (`overflow: hidden`, `position: relative`, caller props winning) whose first
 * child is an absolutely-filled `expo-linear-gradient` behind the caller's
 * children. The frame is ViewCompat, whose native leg mounts a real RN View
 * (Metro resolves `ViewCompat.native` through the base specifier).
 *
 * Stop colors: expo-linear-gradient needs REAL color values — a `var()`
 * expression means nothing to it — so `$` tokens resolve through uniwind's
 * variable store (the Shimmer precedent), with the same up-to-three-level
 * `var()` indirection chase (`--surface1` in `@universe/tailwind/native.css`
 * is declared as `var(--color-surface1-*)`). `useCSSVariable` subscribes to
 * theme changes, so the stops re-resolve on a light/dark flip exactly like
 * the legacy `useTheme()` read. A KNOWN token whose variable does not resolve
 * at runtime degrades to `transparent` with a one-time dev warning (the
 * native visible-drop doctrine); an UNKNOWN `$` token still throws, matching
 * the web leg's color boundary.
 *
 * expo-linear-gradient requires at least two stops; the legacy component
 * forwarded whatever it was given (typed away with casts). The compat skips
 * the gradient element below two stops — the frame and children still render,
 * and the web leg's empty-gradient outcome is the same painted nothing.
 */
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import { forwardRef, type JSX, type Ref } from 'react'
import type { ColorValue as NativeColorValue, OpaqueColorValue, View, ViewStyle } from 'react-native'
import { useCSSVariable } from 'uniwind'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import type { TamaguiVariable } from '../compat/tokens'
import { varReference } from '../shimmer/glare-color'
import { ViewCompat } from '../view-compat/ViewCompat'
import { gradientStopColor } from './compile'
import { warnUnresolvedStopVariable } from './diagnostics'
import type { LinearGradientCompatProps, LinearGradientPointInput } from './props'

const GRADIENT_FILL: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
}

/**
 * Resolve the token-valued stops through uniwind's variable store. Hook count
 * is constant (rules of hooks): each chase level is ONE `useCSSVariable` call
 * over the whole name array — a level with no further indirection re-reads
 * the previous name as a no-op, the Shimmer chain generalized to arrays.
 */
function useNativeGradientStops(
  colors: ReadonlyArray<string | TamaguiVariable | OpaqueColorValue> | undefined,
): NativeColorValue[] {
  const resolved = (colors ?? []).map(gradientStopColor)
  const variableNames = resolved.filter((stop) => stop.kind === 'variable').map((stop) => stop.name)

  const level0 = useCSSVariable(variableNames)
  const names1 = variableNames.map((name, index) => varReference(level0[index]) ?? name)
  const level1 = useCSSVariable(names1)
  const values1 = variableNames.map((name, index) => (names1[index] === name ? level0[index] : level1[index]))
  const names2 = names1.map((name, index) => varReference(values1[index]) ?? name)
  const level2 = useCSSVariable(names2)
  const values2 = names2.map((name, index) => (names2[index] === names1[index] ? values1[index] : level2[index]))
  const names3 = names2.map((name, index) => varReference(values2[index]) ?? name)
  const level3 = useCSSVariable(names3)
  const values3 = names3.map((name, index) => (names3[index] === names2[index] ? values2[index] : level3[index]))

  let variableIndex = 0
  return resolved.map((stop) => {
    if (stop.kind === 'literal') {
      return stop.value
    }
    const value = values3[variableIndex]
    variableIndex += 1
    if (typeof value === 'string' && varReference(value) === undefined) {
      return value
    }
    warnUnresolvedStopVariable(stop.name)
    return 'transparent'
  })
}

export const LinearGradientCompat = forwardRef<View, LinearGradientCompatProps>((props, ref): JSX.Element => {
  const { colors, locations, start, end, children, ...frameProps } = props
  const stops = useNativeGradientStops(colors)
  return (
    <ViewCompat
      overflow="hidden"
      position="relative"
      {...frameProps}
      // tsc resolves only ViewCompat's platformless base (web) leg — see the
      // AnchorCompat.native.tsx ref-cast precedent; at runtime Metro resolves
      // ViewCompat.native, whose ref IS an RN View.
      ref={ref as unknown as Ref<HTMLElement>}
    >
      {stops.length >= 2 ? (
        <ExpoLinearGradient
          colors={stops as unknown as readonly [NativeColorValue, NativeColorValue, ...NativeColorValue[]]}
          locations={locations as unknown as readonly [number, number, ...number[]] | null | undefined}
          start={toExpoPoint(start)}
          end={toExpoPoint(end)}
          style={GRADIENT_FILL}
        />
      ) : null}
      {children}
    </ViewCompat>
  )
})

// The frame delegates to ViewCompat (marked), but the legacy TouchableArea's
// WithInjectedColors reads the marker off THIS element's type — an unmarked
// wrapper would get injected colour guidance over its own styling. Matches what `createCompatComponent` sets on
// factory-built legs (compat/dom.tsx).
LinearGradientCompat.displayName = 'LinearGradientCompat'
markMyceliumPrimitive(LinearGradientCompat)

function toExpoPoint(
  point: LinearGradientPointInput | null | undefined,
): { x: number; y: number } | [number, number] | null | undefined {
  if (point === null || point === undefined) {
    return point
  }
  // `in` rather than Array.isArray: isArray does not narrow readonly tuples.
  if ('x' in point) {
    return point
  }
  return [point[0], point[1]]
}
