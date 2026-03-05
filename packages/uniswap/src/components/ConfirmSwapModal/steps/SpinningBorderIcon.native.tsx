import { PropsWithChildren, useEffect } from 'react'
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Flex } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'

export function SpinningBorderIcon({
  children,
  layoutSize,
}: PropsWithChildren<{ children: React.ReactNode; layoutSize: number }>): JSX.Element {
  const rotation = useSharedValue(0)

  useEffect(() => {
    cancelAnimation(rotation)
    rotation.value = 0
    rotation.value = withRepeat(withTiming(360, { duration: 750, easing: Easing.linear }), -1)
    return (): void => cancelAnimation(rotation)
  }, [])

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ rotate: `${rotation.value}deg` }],
    }),
    [rotation],
  )

  const outerRadius = layoutSize * 0.8
  const spinnerWidth = outerRadius / 10
  const borderRadius = outerRadius / 2

  return (
    <Flex height={layoutSize} width={layoutSize} alignItems="center" justifyContent="center">
      <AnimatedFlex
        position="absolute"
        height={outerRadius}
        width={outerRadius}
        borderRadius={borderRadius}
        borderWidth={spinnerWidth}
        borderColor="$accent1"
        borderLeftColor="transparent"
        borderBottomColor="transparent"
        borderRightColor="transparent"
        style={animatedStyle}
      />
      {children}
    </Flex>
  )
}
