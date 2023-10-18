import React from 'react'
import { StyleSheet, View } from 'react-native'
import {
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { BUTTON_PADDING, TIME_RANGES } from 'src/components/PriceExplorer/constants'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import Trace from 'src/components/Trace/Trace'
import { AnimatedFlex, AnimatedText, Flex, TouchableArea, useSporeColors } from 'ui/src'
import { HistoryDuration } from 'wallet/src/data/__generated__/types-and-hooks'

interface Props {
  label: string
  index: number
  selectedIndex: SharedValue<number>
  transition: SharedValue<number>
}

export function TimeRangeLabel({ index, label, selectedIndex, transition }: Props): JSX.Element {
  const colors = useSporeColors()

  const style = useAnimatedStyle(() => {
    const selected = index === selectedIndex.value

    if (!selected) return { color: colors.neutral2.val }

    const color = interpolateColor(
      transition.value,
      [0, 1],
      [colors.neutral2.val, colors.neutral1.val]
    )

    return { color }
  })

  return (
    <AnimatedText allowFontScaling={false} style={style} textAlign="center" variant="buttonLabel3">
      {label}
    </AnimatedText>
  )
}

export function TimeRangeGroup({
  setDuration,
}: {
  setDuration: (newDuration: HistoryDuration) => void
}): JSX.Element {
  const { chartWidth, buttonWidth, labelWidth } = useChartDimensions()
  const transition = useSharedValue(1)
  const previousIndex = useSharedValue(1)
  const currentIndex = useSharedValue(1)

  // animates slider (time range label background) on press
  const sliderStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: buttonWidth * currentIndex.value + BUTTON_PADDING }],
    }),
    [buttonWidth]
  )

  return (
    <Flex row alignSelf="center" width={chartWidth}>
      <View style={StyleSheet.absoluteFill}>
        <AnimatedFlex
          bg="$surface3"
          borderRadius="$rounded20"
          style={[StyleSheet.absoluteFillObject, sliderStyle]}
          width={labelWidth}
        />
      </View>
      {TIME_RANGES.map(([duration, label, element], index) => {
        return (
          <Trace key={label} logPress element={element}>
            <TouchableArea
              p="$spacing4"
              width={buttonWidth}
              onPress={(): void => {
                setDuration(duration)

                previousIndex.value = currentIndex.value
                transition.value = 0
                currentIndex.value = index
                transition.value = 1
              }}>
              <TimeRangeLabel
                index={index}
                label={label}
                selectedIndex={currentIndex}
                transition={transition}
              />
            </TouchableArea>
          </Trace>
        )
      })}
    </Flex>
  )
}
