import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import { LayoutRectangle, View } from 'react-native'
import {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedBox } from 'src/components/layout'

export function LaserLoader() {
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const xPosition = useSharedValue(0)

  const theme = useAppTheme()

  const LASER = {
    width: 30,
    height: 2,
    color: theme.colors.accentAction,
    duration: 1200,
  }

  useEffect(() => {
    xPosition.value = withRepeat(withTiming(1, { duration: LASER.duration }), Infinity, false)
    // only want to do this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            xPosition.value,
            [0, 1],
            [-LASER.width, layout ? layout.width + LASER.width : 0]
          ),
        },
      ],
    }
  }, [xPosition.value])

  if (!layout) {
    return <View onLayout={(event) => setLayout(event.nativeEvent.layout)} />
  }

  return (
    <AnimatedBox style={[animatedStyles]}>
      <LinearGradient
        colors={['transparent', LASER.color, LASER.color, LASER.color, 'transparent']}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={{ height: LASER.height, width: LASER.width }}
      />
    </AnimatedBox>
  )
}
