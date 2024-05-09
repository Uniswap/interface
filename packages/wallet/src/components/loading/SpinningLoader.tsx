import { useEffect } from 'react'
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { AnimatedFlex, ColorTokens } from 'ui/src'
import { CircleSpinner, EmptySpinner } from 'ui/src/components/icons'

export function SpinningLoader({
  size = 20,
  disabled,
  color,
}: {
  size?: number
  disabled?: boolean
  color?: ColorTokens
}): JSX.Element {
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
      -1
    )
    return () => cancelAnimation(rotation)
  }, [rotation])

  if (disabled) {
    return <EmptySpinner color="$neutral3" size={size} />
  }

  return (
    <AnimatedFlex sentry-label="SpinningLoader" style={[animatedStyles]}>
      <CircleSpinner color={color ?? '$neutral2'} size={size} />
    </AnimatedFlex>
  )
}
