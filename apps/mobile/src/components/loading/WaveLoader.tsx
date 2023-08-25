import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Flex } from 'src/components/layout'
import { CHART_HEIGHT } from 'src/components/PriceExplorer/constants'
import Wave from 'ui/src/assets/backgrounds/wave.svg'

const WAVE_WIDTH = 416
const WAVE_DURATION = 2000

export function WaveLoader(): JSX.Element {
  const theme = useAppTheme()
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
      row
      alignItems="center"
      flexGrow={1}
      gap="none"
      height={CHART_HEIGHT}
      justifyContent="center"
      sentry-label="WaveLoader">
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Flex row alignItems="center" flexGrow={1} gap="none" height="100%" justifyContent="center">
          <Wave color={theme.colors.surface3} />
          <Wave color={theme.colors.surface3} />
          <Wave color={theme.colors.surface3} />
        </Flex>
      </Animated.View>
    </Flex>
  )
}
