import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import { Flex, useSporeColors } from 'ui/src'
import Wave from 'ui/src/assets/backgrounds/wave.svg'

const WAVE_WIDTH = 416
const WAVE_DURATION = 2000

export function WaveLoader(): JSX.Element {
  const colors = useSporeColors()
  const yPosition = useSharedValue(0)
  const { chartHeight } = useChartDimensions()

  useEffect(() => {
    yPosition.value = withRepeat(withTiming(1, { duration: WAVE_DURATION }), Infinity, false)
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(yPosition.value, [0, 1], [0, -WAVE_WIDTH]),
      },
    ],
  }))

  return (
    <Flex grow row alignItems="center" height={chartHeight} justifyContent="center">
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Flex centered grow row height="100%">
          <Wave color={colors.neutral3.get()} />
          <Wave color={colors.neutral3.get()} />
          <Wave color={colors.neutral3.get()} />
        </Flex>
      </Animated.View>
    </Flex>
  )
}
