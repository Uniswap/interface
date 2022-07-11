import React, { useEffect } from 'react'
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Loader from 'src/assets/icons/circle-spinner.svg'
import { AnimatedBox } from 'src/components/layout'

export function SpinningLoader({ size }: { size: number }) {
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
        easing: Easing.linear,
      }),
      -1
    )
    return () => cancelAnimation(rotation)
  }, [rotation])

  return (
    <AnimatedBox style={[animatedStyles]}>
      <Loader height={size} width={size} />
    </AnimatedBox>
  )
}
