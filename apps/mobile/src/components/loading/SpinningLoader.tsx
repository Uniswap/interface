import React, { useEffect } from 'react'
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { AnimatedBox } from 'src/components/layout'
import { ColorTokens, Icons } from 'ui/src'

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
  }, [rotation.value])

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
    return <Icons.EmptySpinner color="$neutral3" height={size} width={size} />
  }
  return (
    <AnimatedBox sentry-label="SpinningLoader" style={[animatedStyles]}>
      <Icons.CircleSpinner color={color ?? '$neutral1'} height={size} width={size} />
    </AnimatedBox>
  )
}
