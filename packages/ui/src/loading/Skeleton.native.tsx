import MaskedView from '@react-native-masked-view/masked-view'
import { SetStateAction, useLayoutEffect, useState } from 'react'
import { LayoutRectangle, StyleSheet } from 'react-native'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'tamagui/linear-gradient'
import { Flex } from 'ui/src/components/layout/Flex'
import { SkeletonProps } from 'ui/src/loading/SkeletonProps'

const SHIMMER_DURATION = 2000 // 2 seconds

// inspired by tutorial found here: https://github.com/kadikraman/skeleton-loader
export function Skeleton({ children, contrast, disabled }: SkeletonProps): JSX.Element {
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const xPosition = useSharedValue(0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: only want to do this once on mount
  useLayoutEffect(() => {
    // TODO: [MOB-210] tweak animation to be smoother, right now sometimes looks kind of stuttery
    xPosition.value = withRepeat(withTiming(1, { duration: SHIMMER_DURATION }), Infinity, true)
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(xPosition.value, [0, 1], [layout ? -layout.width : 0, layout ? layout.width : 0]),
      },
    ],
  }))

  if (disabled) {
    return children
  }

  if (!layout) {
    return (
      <Flex
        opacity={0}
        testID="shimmer-placeholder"
        onLayout={(event: { nativeEvent: { layout: SetStateAction<LayoutRectangle | null | undefined> } }): void => {
          setLayout(event.nativeEvent.layout)
        }}
      >
        {children}
      </Flex>
    )
  }

  return (
    <MaskedView
      maskElement={children}
      style={{
        width: layout.width,
        height: layout.height,
      }}
      testID="shimmer"
    >
      <Flex grow backgroundColor={contrast ? '$neutral2' : '$surface3'} overflow="hidden" />
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
          style={StyleSheet.absoluteFill}
        >
          <Flex backgroundColor="$surface2" style={StyleSheet.absoluteFill} />
        </MaskedView>
      </Reanimated.View>
    </MaskedView>
  )
}
