import React from 'react'
import { StyleSheet } from 'react-native'
import { PanGestureHandler } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { getYForX, Vector } from 'react-native-redash'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import { GraphIndex, GraphMetadata } from 'src/components/PriceChart/Model'

const CURSOR_SIZE = 50

interface CursorProps {
  index: Animated.SharedValue<GraphIndex>
  translation: Vector<Animated.SharedValue<number>>
  graphs: GraphMetadata[]
}

export const Cursor = ({ index, translation, graphs }: CursorProps) => {
  const isActive = useSharedValue(false)
  const onGestureEvent = useAnimatedGestureHandler({
    onStart: () => {
      isActive.value = true
    },
    onActive: (event) => {
      translation.x.value = event.x
      translation.y.value = getYForX(graphs[index.value].data.path, translation.x.value) || 0
    },
    onEnd: () => {
      isActive.value = false
    },
  })

  const style = useAnimatedStyle(() => {
    const translateX = translation.x.value - CURSOR_SIZE / 2
    const translateY = translation.y.value - CURSOR_SIZE / 2
    return {
      transform: [{ translateX }, { translateY }, { scale: withSpring(isActive.value ? 1 : 0) }],
    }
  })

  return (
    <Box flex={1} style={StyleSheet.absoluteFill}>
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <AnimatedBox style={StyleSheet.absoluteFill}>
          <AnimatedBox
            alignItems="center"
            // bg="white"
            borderRadius="full"
            height={CURSOR_SIZE}
            justifyContent="center"
            style={style}
            width={CURSOR_SIZE}>
            <Box width={15} height={15} borderRadius="full" bg="primary1" />
          </AnimatedBox>
        </AnimatedBox>
      </PanGestureHandler>
    </Box>
  )
}
