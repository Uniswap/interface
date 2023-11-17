import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import { LayoutRectangle, StyleSheet } from 'react-native'
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Flex } from 'ui/src/components/layout'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { opacify } from 'ui/src/theme'
import { ShineProps } from './ShineProps'
const SHIMMER_DURATION = 2000 // 2 seconds

export function Shine({ children, disabled }: ShineProps): JSX.Element {
  const colors = useSporeColors()

  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const xPosition = useSharedValue(0)

  useEffect(() => {
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
    return (
      <Flex
        opacity={0}
        onLayout={(event: {
          nativeEvent: { layout: React.SetStateAction<LayoutRectangle | null | undefined> }
        }): void => setLayout(event.nativeEvent.layout)}>
        {children}
      </Flex>
    )
  }

  if (!disabled) {
    return (
      <MaskedView maskElement={children} style={{ width: layout.width, height: layout.height }}>
        <Flex grow backgroundColor="$neutral2" height="100%" overflow="hidden" />
        <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <LinearGradient
            colors={[
              opacify(0, colors.neutral2.val.slice(0, 7)),
              opacify(44, colors.surface2.val.slice(0, 7)),
              opacify(0, colors.neutral2.val.slice(0, 7)),
            ]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Reanimated.View>
      </MaskedView>
    )
  }

  return children
}
