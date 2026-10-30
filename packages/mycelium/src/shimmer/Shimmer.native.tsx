import { LinearGradient } from 'expo-linear-gradient'
import { type JSX, useEffect, useState } from 'react'
import { type LayoutChangeEvent, type LayoutRectangle, StyleSheet, View } from 'react-native'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useEvent } from 'utilities/src/react/hooks'
import { useThemeVariable } from '../theme/useThemeVariable.native'
import { FALLBACK_GLARE_COLOR, opacifyGlareColor, resolveGlareColor } from './glare-color'
import type { ShimmerProps } from './ShimmerProps'

const LINEAR_GRADIENT_START = { x: 0, y: 0 }
const LINEAR_GRADIENT_END = { x: 1, y: 0 }

const NATIVE_SHIMMER_DURATION_SECONDS = 2
const ONE_SECOND_MS = 1000

/**
 * Native `Shimmer`: a Reanimated glare sweep overlaid on the content and
 * clipped by the container — the same effect (and default timing) as the
 * legacy ui `Shine` it replaced. Masking via
 * @react-native-masked-view is not Fabric-compatible, so the glare is an
 * overlay, not a mask.
 *
 * The glare tint follows the `surface1` theme token (via uniwind's variable
 * store, matching the legacy `useSporeColors().surface1.val`), falling back to
 * white when the token doesn't resolve to a simple hex.
 *
 * The wrapper renders even when `disabled` so children keep their React
 * identity across enable/disable toggles — remounting them resets in-flight
 * animations (e.g. digit rolls).
 *
 * TODO(INFRA-2353): native style parity rides the native parity harness once
 * it lands — the web leg's parity suite lives in
 * packages/tailwind/src/parity/shimmer.
 */
export function Shimmer({
  children,
  disabled = false,
  shimmerDurationSeconds = NATIVE_SHIMMER_DURATION_SECONDS,
  className,
  testID,
  flexDirection,
  width,
  height,
  justifyContent,
  alignItems,
}: ShimmerProps): JSX.Element {
  const shimmerDurationMs = shimmerDurationSeconds * ONE_SECOND_MS
  const surface1 = useThemeVariable('--surface1')

  const [layout, setLayout] = useState<LayoutRectangle | null>(null)
  const xPosition = useSharedValue(0)
  const showShimmer = !disabled && layout !== null

  useEffect(() => {
    if (!showShimmer) {
      return undefined
    }
    xPosition.value = withRepeat(withTiming(1, { duration: shimmerDurationMs }), Infinity, false)
    return () => {
      xPosition.value = 0
    }
    // oxlint-disable-next-line react/exhaustive-deps -- xPosition is a stable Reanimated shared value (same exclusion as the legacy Shine)
  }, [showShimmer, shimmerDurationMs])

  const animatedStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFill,
    transform: [
      {
        translateX: interpolate(xPosition.value, [0, 1], [layout ? -layout.width : 0, layout ? layout.width : 0]),
      },
    ],
  }))

  // Precomputed in render (NOT inside the worklet), like the legacy Shine —
  // gradient stop colors are plain LinearGradient props.
  const glareColor = resolveGlareColor(surface1)
  if (__DEV__ && glareColor === FALLBACK_GLARE_COLOR && surface1 !== FALLBACK_GLARE_COLOR) {
    // oxlint-disable-next-line no-console -- __DEV__-only diagnostic; a white fallback glare is invisible-in-light/wrong-in-dark and would otherwise slip through QA silently
    console.warn(
      `Shimmer: --surface1 did not resolve to a simple hex (got ${JSON.stringify(surface1)}); falling back to a white glare. Check the uniwind theme wiring.`,
    )
  }
  const glareStops = [
    opacifyGlareColor(0, glareColor),
    opacifyGlareColor(60, glareColor),
    opacifyGlareColor(0, glareColor),
  ] as const

  const handleLayout = useEvent((event: LayoutChangeEvent): void => {
    setLayout(event.nativeEvent.layout)
  })

  // Omitted entirely (not an all-undefined object) when no layout prop is set, mirroring
  // the web leg's `style={undefined}` collapse — keeps both legs on the same omission
  // contract instead of one always allocating a no-op style object per render.
  const layoutStyle =
    flexDirection === undefined &&
    width === undefined &&
    height === undefined &&
    justifyContent === undefined &&
    alignItems === undefined
      ? undefined
      : { flexDirection, width, height, justifyContent, alignItems }

  return (
    <View
      className={className}
      testID={testID}
      // The layout slice rides the same style array RN already merges
      // (INFRA-3822) — these are the same property names on both platforms.
      style={[styles.container, layoutStyle]}
      onLayout={handleLayout}
    >
      {children}
      {showShimmer ? (
        // Clip only the sweeping glare — children may intentionally overhang (e.g. rolling digits).
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glareClip]} testID="shimmer">
          <Reanimated.View style={animatedStyle}>
            <LinearGradient
              colors={glareStops}
              start={LINEAR_GRADIENT_START}
              end={LINEAR_GRADIENT_END}
              style={StyleSheet.absoluteFill}
            />
          </Reanimated.View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glareClip: {
    overflow: 'hidden',
  },
})
