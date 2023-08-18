import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import { LayoutRectangle, StyleSheet, View } from 'react-native'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Box } from 'src/components/layout'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { opacify } from 'src/utils/colors'
import { theme } from 'ui/src/theme/restyle'

const SHIMMER_DURATION = 2000 // 2 seconds

type Props = {
  children: JSX.Element
}
// inspired by tutorial found here: https://github.com/kadikraman/skeleton-loader
export function Shimmer({ children }: Props): JSX.Element {
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const xPosition = useSharedValue(0)
  const isDarkMode = useIsDarkMode()

  useEffect(() => {
    // TODO: [MOB-210] tweak animation to be smoother, right now sometimes looks kind of stuttery
    xPosition.value = withRepeat(withTiming(1, { duration: SHIMMER_DURATION }), Infinity, false)

    // only want to do this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          xPosition.value,
          [0, 1],
          [layout ? -layout.width : 0, layout ? layout.width : 0]
        ),
      },
    ],
  }))

  if (!layout) {
    return <View onLayout={(event): void => setLayout(event.nativeEvent.layout)}>{children}</View>
  }

  return (
    <MaskedView
      maskElement={children}
      sentry-label="Shimmer"
      style={{
        width: layout.width,
        height: layout.height,
      }}>
      <Box backgroundColor={isDarkMode ? 'neutral2' : 'neutral1'} flexGrow={1} overflow="hidden" />
      <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <MaskedView
          maskElement={
            <LinearGradient
              colors={['transparent', opacify(50, theme.colors.sporeBlack), 'transparent']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          }
          style={StyleSheet.absoluteFill}>
          <Box backgroundColor="surface2" style={StyleSheet.absoluteFill} />
        </MaskedView>
      </Reanimated.View>
    </MaskedView>
  )
}
