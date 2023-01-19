import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { getYForX, round } from 'react-native-redash'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import {
  AnimatedNumber,
  AnimatedTranslation,
  GraphMetadatas,
} from 'src/components/PriceChart/types'
import { CHART_HEIGHT } from 'src/components/PriceChart/utils'
import { opacify } from 'src/utils/colors'

const CURSOR_INNER_SIZE = 12
const CURSOR_SIZE = CURSOR_INNER_SIZE + 6
const LINE_WIDTH = 1

// Length in screen unit of a single tick
// TODO(MOB-2255): correlate ticks to scale
const TICK_LENGTH = 10

interface CursorProps {
  graphs: GraphMetadatas
  index: AnimatedNumber
  isActive: SharedValue<boolean>
  translation: AnimatedTranslation
  cursorColor?: NullUndefined<string>
}

export const Cursor = ({
  graphs,
  index,
  isActive,
  translation,
  cursorColor,
}: CursorProps): JSX.Element => {
  const theme = useAppTheme()

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart(() => {
      isActive.value = true
      runOnJS(impactAsync)(ImpactFeedbackStyle.Light)
    })
    .onUpdate((event) => {
      // First verify if we're crossing a tick for haptic feedback
      const hasCrossedTick =
        round(event.x / TICK_LENGTH) * TICK_LENGTH !==
        round(translation.x.value / TICK_LENGTH) * TICK_LENGTH
      if (hasCrossedTick) {
        runOnJS(impactAsync)(ImpactFeedbackStyle.Light)
      }

      // Then update value continuously
      translation.x.value = event.x
      const graph = graphs[index.value]
      if (graph) {
        translation.y.value = getYForX(graph.data.path, translation.x.value) || 0
      }
    })
    .onFinalize(() => (isActive.value = false))

  const containerStyles = useAnimatedStyle(() => ({
    opacity: withTiming(isActive.value ? 1 : 0),
  }))

  // cursor position and scale animation
  const cursorAnimatedStyles = useAnimatedStyle(() => {
    const translateX = translation.x.value - CURSOR_SIZE / 2
    const translateY = translation.y.value - CURSOR_SIZE / 2
    return {
      transform: [{ translateX }, { translateY }, { scale: withSpring(isActive.value ? 1 : 0) }],
    }
  })
  const verticalLineAnimatedStyles = useAnimatedStyle(() => {
    const translateX = translation.x.value - LINE_WIDTH
    return {
      transform: [{ translateX }, { scale: withTiming(isActive.value ? 1 : 0) }],
    }
  })

  return (
    <Box flex={1} style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={panGesture}>
        <AnimatedBox style={[StyleSheet.absoluteFill, containerStyles]}>
          {/* Vertical line */}
          <AnimatedBox
            borderRadius="xs"
            borderStyle="dashed"
            borderWidth={1}
            height={CHART_HEIGHT}
            style={[
              verticalLineAnimatedStyles,
              StyleSheet.absoluteFill,
              {
                borderColor: cursorColor
                  ? opacify(50, cursorColor)
                  : theme.colors.backgroundOutline,
              },
            ]}
            width={LINE_WIDTH}
          />

          {/* Circular cursor */}
          <AnimatedBox
            alignItems="center"
            height={CURSOR_SIZE}
            justifyContent="center"
            position="relative"
            style={cursorAnimatedStyles}
            width={CURSOR_SIZE}>
            <Box
              borderRadius="full"
              height={CURSOR_INNER_SIZE}
              style={{ backgroundColor: cursorColor ?? theme.colors.textSecondary }}
              width={CURSOR_INNER_SIZE}
            />
          </AnimatedBox>
        </AnimatedBox>
      </GestureDetector>
    </Box>
  )
}
