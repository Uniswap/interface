/**
 * Native leg of the SpinningLoader compat (INFRA-3644) — the `ui/src`
 * SpinningLoader rebuild's native leg, re-homed: a reanimated rotation around
 * mycelium's `CircleSpinner` icon.
 */
import { type JSX, useEffect } from 'react'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import { CircleSpinner } from '../components/icons/CircleSpinner'
import { EmptySpinner } from '../components/icons/EmptySpinner'
import type { SpinningLoaderCompatProps } from './props'

export type { SpinningLoaderCompatProps } from './props'

export function SpinningLoaderCompat({ size = 20, disabled, color }: SpinningLoaderCompatProps): JSX.Element {
  const rotation = useSharedValue(0)

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotateZ: `${rotation.value}deg`,
        },
      ],
    }
  }, [rotation])

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        // easeInOutQuint, matching the web leg's cubic-bezier(0.83, 0, 0.17, 1) exactly —
        // the same hand-written bezier the legacy leg pinned (no Spore preset carries it).
        easing: Easing.bezier(0.83, 0, 0.17, 1),
      }),
      -1,
    )
    return () => cancelAnimation(rotation)
    // oxlint-disable-next-line react/exhaustive-deps -- transcribed from the legacy leg: the loop arms once on mount
  }, [])

  if (disabled) {
    return <EmptySpinner color="$neutral3" size={size} />
  }

  /*
   * We need to set the height and width to the icon's `size` prop because `CircleSpinner` is a SVG and doesn't perfectly respect the `size` prop if it's a float
   * For example, if `size` is 20, the CircleSpinner will be 20x20
   * But, if `size` is 20.x, the CircleSpinner will still be 20x20 (it always rounds down)
   *
   * Direct Reanimated host: the legacy AnimatedFlex wrapper only contributed Tamagui Flex's
   * `flexDirection: 'column'`, which is already the RN View default.
   */
  return (
    <Animated.View style={[animatedStyles, { height: size, width: size }]}>
      <CircleSpinner color={color ?? '$neutral2'} size={size} />
    </Animated.View>
  )
}

SpinningLoaderCompat.displayName = 'SpinningLoaderCompat'

// Legacy color-injecting wrappers (TouchableArea compat) must skip this
// primitive — it styles itself; its `color` prop is the sanctioned way to
// tint the spinner.
markMyceliumPrimitive(SpinningLoaderCompat)
