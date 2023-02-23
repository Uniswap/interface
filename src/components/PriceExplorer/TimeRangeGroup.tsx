import React from 'react'
import { StyleSheet, View } from 'react-native'
import {
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import {
  BUTTON_PADDING,
  BUTTON_WIDTH,
  CHART_WIDTH,
  LABEL_WIDTH,
  TIME_RANGES,
} from 'src/components/PriceExplorer/constants'
import { TracePressEvent } from 'src/components/telemetry/TraceEvent'
import { Text } from 'src/components/Text'
import { HistoryDuration } from 'src/data/__generated__/types-and-hooks'

interface Props {
  label: string
  index: number
  selectedIndex: SharedValue<number>
  transition: SharedValue<number>
}

export function TimeRangeLabel({ index, label, selectedIndex, transition }: Props): JSX.Element {
  const theme = useAppTheme()

  const style = useAnimatedStyle(() => {
    const selected = index === selectedIndex.value

    if (!selected) return { color: theme.colors.textSecondary }

    const color = interpolateColor(
      transition.value,
      [0, 1],
      [theme.colors.textSecondary, theme.colors.textPrimary]
    )

    return { color }
  })

  return (
    <Text
      animated
      allowFontScaling={false}
      style={style}
      textAlign="center"
      variant="buttonLabelSmall">
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
    transform: [{ translateX: withTiming(BUTTON_WIDTH * currentIndex.value + BUTTON_PADDING) }],
  }))

  return (
    <Box alignSelf="center" flexDirection="row" width={CHART_WIDTH}>
      <View style={StyleSheet.absoluteFill}>
        <AnimatedBox
          bg="background3"
          borderRadius="rounded20"
          style={[StyleSheet.absoluteFillObject, sliderStyle]}
          width={LABEL_WIDTH}
        />
      </View>
      {TIME_RANGES.map(([duration, label, element], index) => {
        return (
          <TracePressEvent element={element}>
            <TouchableArea
              key={label}
              p="spacing4"
              width={BUTTON_WIDTH}
              onPress={(): void => {
                setDuration(duration)

                previousIndex.value = currentIndex.value
                transition.value = 0
                currentIndex.value = index
                transition.value = withTiming(1)
              }}>
              <TimeRangeLabel
                index={index}
                label={label}
                selectedIndex={currentIndex}
                transition={transition}
              />
            </TouchableArea>
          </TracePressEvent>
        )
      })}
    </Box>
  )
}
