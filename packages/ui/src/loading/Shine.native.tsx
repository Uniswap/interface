import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { LayoutRectangle, StyleSheet } from 'react-native'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Flex } from 'ui/src/components/layout'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { ShineProps } from 'ui/src/loading/ShineProps'
import { opacify } from 'ui/src/theme'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const LINEAR_GRADIENT_END = { x: 1, y: 0 }
const LINEAR_GRADIENT_START = { x: 0, y: 0 }

const WHITE_HEX_COLOR = '#FFFFFF'

/**
 * Glare sweep overlaid on the content and clipped by the container. Masking via
 * @react-native-masked-view is not Fabric-compatible (no Fabric impl upstream; the interop
 * layer applies the mask non-deterministically), so the shine must not depend on it.
 *
 * The wrapper renders even when disabled so children keep their React identity across
 * enable/disable toggles — remounting them resets in-flight animations (e.g. digit rolls).
 */
export function Shine({ shimmerDurationSeconds = 2, children, disabled, ...rest }: ShineProps): JSX.Element {
  const colors = useSporeColors()
  const shimmerDuration = shimmerDurationSeconds * ONE_SECOND_MS

  const [layout, setLayout] = useState<LayoutRectangle | null>(null)
  const xPosition = useSharedValue(0)
  const showShine = !disabled && layout !== null

  useEffect(() => {
    if (!showShine) {
      return undefined
    }
    xPosition.value = withRepeat(withTiming(1, { duration: shimmerDuration }), Infinity, false)
    return () => {
      xPosition.value = 0
    }
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [showShine, shimmerDuration])

  const animatedStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFill,
    transform: [
      {
        translateX: interpolate(xPosition.value, [0, 1], [layout ? -layout.width : 0, layout ? layout.width : 0]),
      },
    ],
  }))

  const handleOnLayout = useEvent((event: { nativeEvent: { layout: LayoutRectangle } }): void => {
    setLayout(event.nativeEvent.layout)
  })

  const glareColor = ((): string => {
    const maybeColor = colors.surface1.val
    return maybeColor.startsWith('#') && maybeColor.length === 7 ? maybeColor : WHITE_HEX_COLOR
  })()

  return (
    <Flex {...rest} position="relative" onLayout={handleOnLayout}>
      {children}
      {showShine ? (
        // Clip only the sweeping glare — children may intentionally overhang (e.g. rolling digits).
        <Flex overflow="hidden" pointerEvents="none" style={StyleSheet.absoluteFill} testID="shimmer">
          <Reanimated.View style={animatedStyle}>
            <LinearGradient
              colors={[opacify(0, glareColor), opacify(60, glareColor), opacify(0, glareColor)]}
              end={LINEAR_GRADIENT_END}
              start={LINEAR_GRADIENT_START}
              style={StyleSheet.absoluteFill}
            />
          </Reanimated.View>
        </Flex>
      ) : null}
    </Flex>
  )
}
