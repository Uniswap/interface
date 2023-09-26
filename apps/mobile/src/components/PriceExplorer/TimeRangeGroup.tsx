import React from 'react'
import { StyleSheet, View } from 'react-native'
import {
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { AnimatedBox } from 'src/components/layout/Box'
import {
  BUTTON_PADDING,
  BUTTON_WIDTH,
  CHART_WIDTH,
  LABEL_WIDTH,
  TIME_RANGES,
} from 'src/components/PriceExplorer/constants'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { Flex, TouchableArea, useSporeColors } from 'ui/src'
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

    if (!selected) return { color: colors.neutral2.get() }

    const color = interpolateColor(
      transition.value,
      [0, 1],
      [colors.neutral2.get(), colors.neutral1.get()]
    )

    return { color }
  })

  return (
    <Text animated allowFontScaling={false} style={style} textAlign="center" variant="buttonLabel3">
      {label}
    </Text>
  )
}

export function TimeRangeGroup({
  setDuration,
}: {
  setDuration: (newDuration: HistoryDuration) => void
}): JSX.Element {
  const transition = useSharedValue(1)
  const previousIndex = useSharedValue(1)
  const currentIndex = useSharedValue(1)

  // animates slider (time range label background) on press
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: BUTTON_WIDTH * currentIndex.value + BUTTON_PADDING }],
  }))

  return (
    <Flex row alignSelf="center" width={CHART_WIDTH}>
      <View style={StyleSheet.absoluteFill}>
        <AnimatedBox
          bg="$surface3"
          borderRadius="$rounded20"
          style={[StyleSheet.absoluteFillObject, sliderStyle]}
          width={LABEL_WIDTH}
        />
      </View>
      {TIME_RANGES.map(([duration, label, element], index) => {
        return (
          <Trace key={label} logPress element={element}>
            <TouchableArea
              p="$spacing4"
              width={BUTTON_WIDTH}
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
