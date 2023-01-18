import { useTheme } from '@shopify/restyle'
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
import EmptySpinner from 'src/assets/icons/empty-spinner.svg'
import { AnimatedBox } from 'src/components/layout'
import { Theme } from 'src/styles/theme'

export function SpinningLoader({
  size = 20,
  disabled,
  color,
}: {
  size?: number
  disabled?: boolean
  color?: keyof Theme['colors']
}): JSX.Element {
  const theme = useTheme()
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

  if (disabled) {
    return <EmptySpinner height={size} width={size} />
  }
  return (
    <AnimatedBox style={[animatedStyles]}>
      <Loader color={theme.colors[color ?? 'accentActive']} height={size} width={size} />
    </AnimatedBox>
  )
}
