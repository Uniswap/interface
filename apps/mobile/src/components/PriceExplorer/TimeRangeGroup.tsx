import React, { useState } from 'react'
import { I18nManager, StyleSheet, View } from 'react-native'
import {
  SharedValue,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { TIME_RANGES } from 'src/components/PriceExplorer/constants'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import Trace from 'src/components/Trace/Trace'
import { AnimatedFlex, AnimatedText, Flex, TouchableArea, useSporeColors } from 'ui/src'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

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

    if (!selected) {
      return { color: colors.neutral2.val }
    }

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
  const [adjustedLabelWidth, setAdjustedLabelWidth] = useState(labelWidth)

  const isRTL = I18nManager.isRTL

  // animates slider (time range label background) on press
  const sliderStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX:
            (buttonWidth * currentIndex.value + (buttonWidth - adjustedLabelWidth) / 2) *
            // left if RTL, right if LTR
            (isRTL ? -1 : 1),
        },
      ],
    }),
    [adjustedLabelWidth, buttonWidth, currentIndex, isRTL]
  )

  return (
    <Flex row alignSelf="center" width={chartWidth}>
      <View style={StyleSheet.absoluteFill}>
        <AnimatedFlex
          backgroundColor="$surface3"
          borderRadius="$rounded20"
          style={[StyleSheet.absoluteFillObject, sliderStyle]}
          width={adjustedLabelWidth}
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
              <Flex
                alignSelf="center"
                minWidth={adjustedLabelWidth}
                px="$spacing8"
                onLayout={({
                  nativeEvent: {
                    layout: { width },
                  },
                }): void => {
                  if (width > adjustedLabelWidth) {
                    setAdjustedLabelWidth(width)
                  }
                }}>
                <TimeRangeLabel
                  index={index}
                  label={label}
                  selectedIndex={currentIndex}
                  transition={transition}
                />
              </Flex>
            </TouchableArea>
          </Trace>
        )
      })}
    </Flex>
  )
}
