import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { CHART_HEIGHT } from 'src/components/PriceExplorer/constants'
import { Flex, useSporeColors } from 'ui/src'
import Wave from 'ui/src/assets/backgrounds/wave.svg'

const WAVE_WIDTH = 416
const WAVE_DURATION = 2000

export function WaveLoader(): JSX.Element {
  const colors = useSporeColors()
  const yPosition = useSharedValue(0)

  useEffect(() => {
    yPosition.value = withRepeat(withTiming(1, { duration: WAVE_DURATION }), Infinity, false)

    // only want to do this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(yPosition.value, [0, 1], [0, -WAVE_WIDTH]),
      },
    ],
  }))

  return (
    <Flex
      grow
      row
      alignItems="center"
      gap="$none"
      height={CHART_HEIGHT}
      justifyContent="center"
      sentry-label="WaveLoader">
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Flex centered grow row gap="$none" height="100%">
          <Wave color={colors.surface3.val} />
          <Wave color={colors.surface3.val} />
          <Wave color={colors.surface3.val} />
        </Flex>
      </Animated.View>
    </Flex>
  )
}
