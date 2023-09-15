import MaskedView from '@react-native-masked-view/masked-view'
import { useLayoutEffect, useState } from 'react'
import { LayoutRectangle, StyleSheet, View } from 'react-native'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'tamagui/linear-gradient'
import { Flex } from 'ui/src'
import { Box } from 'ui/src/components/layout/Box'

const SHIMMER_DURATION = 2000 // 2 seconds

type Props = {
  children: JSX.Element
  contrast?: boolean
}

// inspired by tutorial found here: https://github.com/kadikraman/skeleton-loader
export function Shimmer({ children, contrast }: Props): JSX.Element {
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const xPosition = useSharedValue(0)

  useLayoutEffect(() => {
    // TODO: [MOB-210] tweak animation to be smoother, right now sometimes looks kind of stuttery
    xPosition.value = withRepeat(withTiming(1, { duration: SHIMMER_DURATION }), Infinity, true)

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
      <Flex
        grow
        backgroundColor={contrast ? '$neutral2' : '$surface3'}
        gap="$none"
        overflow="hidden"
      />
      <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <MaskedView
          maskElement={
            <LinearGradient
              fullscreen
              colors={['transparent', 'black', 'black', 'black', 'transparent']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
            />
          }
          style={StyleSheet.absoluteFill}>
          <Box fullscreen backgroundColor="$surface2" />
        </MaskedView>
      </Reanimated.View>
    </MaskedView>
  )
}
