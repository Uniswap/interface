import { useEffect } from 'react'
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { CircleSpinner, EmptySpinner } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { SpinningLoaderProps } from 'ui/src/loading/types'

export function SpinningLoader({ size = 20, disabled, color }: SpinningLoaderProps): JSX.Element {
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
        easing: Easing.bezier(0.83, 0, 0.17, 1),
      }),
      -1,
    )
    return () => cancelAnimation(rotation)
  }, [])

  if (disabled) {
    return <EmptySpinner color="$neutral3" size={size} />
  }

  /*
   * We need to set the height and width of the AnimatedFlex to the icon's `size` prop because `CircleSpinner` is a SVG and doesn't perfectly respect the `size` prop if it's a float
   * For example, if `size` is 20, the CircleSpinner will be 20x20
   * But, if `size` is 20.x, the CircleSpinner will still be 20x20 (it always rounds down)
   */
  return (
    <AnimatedFlex style={animatedStyles} height={size} width={size}>
      <CircleSpinner color={color ?? '$neutral2'} size={size} />
    </AnimatedFlex>
  )
}
