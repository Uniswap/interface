import React from 'react'
import { StyleSheet } from 'react-native'
import { PanGestureHandler } from 'react-native-gesture-handler'
import {
  SharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { getYForX } from 'react-native-redash'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import {
  AnimatedNumber,
  AnimatedTranslation,
  GraphMetadatas,
} from 'src/components/PriceChart/types'

const CURSOR_SIZE = 50

interface CursorProps {
  graphs: GraphMetadatas
  index: AnimatedNumber
  isActive: SharedValue<boolean>
  translation: AnimatedTranslation
}

export const Cursor = ({ graphs, index, isActive, translation }: CursorProps) => {
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

  // cursor position and scale animation
  const cursorAnimatedStyles = useAnimatedStyle(() => {
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
            borderRadius="full"
            height={CURSOR_SIZE}
            justifyContent="center"
            style={[styles.cursor, cursorAnimatedStyles]}
            width={CURSOR_SIZE}>
            <Box bg="primary1" borderRadius="full" height={15} width={15} />
          </AnimatedBox>
        </AnimatedBox>
      </PanGestureHandler>
    </Box>
  )
}

const styles = StyleSheet.create({
  cursor: {
    backgroundColor: 'rgba(243, 71, 191, 0.171)',
  },
})
