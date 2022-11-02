import React, { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { mixPath, useVector } from 'react-native-redash'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import { Cursor } from 'src/components/PriceChart/Cursor'
import { PriceHeader } from 'src/components/PriceChart/PriceHeader'
import { TimeRangeLabel } from 'src/components/PriceChart/TimeRangeLabel'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { HEIGHT, NUM_GRAPHS, WIDTH } from 'src/components/PriceChart/utils'

const AnimatedPath = Animated.createAnimatedComponent(Path)

export const BUTTON_PADDING = 20
export const BUTTON_WIDTH = WIDTH / NUM_GRAPHS
export const LABEL_WIDTH = BUTTON_WIDTH - BUTTON_PADDING * 2

interface GraphProps {
  graphs: GraphMetadatas
  headerCustomPrice?: number
  headerCustomPercentChange?: number
  customChartLabel?: ReactNode
}

/**
 * Displays a set of graphs with header, scrubbable chart and navigation row.
 * Inspired by https://github.com/wcandillon/can-it-be-done-in-react-native/tree/master/season4/src/Rainbow
 *
 * Will render the props headerCustomPrice and headerPercentChange except when scrubbing
 */
export const PriceExplorer = ({
  graphs,
  headerCustomPrice,
  headerCustomPercentChange,
  customChartLabel,
}: GraphProps) => {
  const theme = useAppTheme()

  // whether the graph pan gesture is active
  const isPanning = useSharedValue(false)
  // pan gesture x and y
  const translation = useVector()
  // used in animations
  const transition = useSharedValue(1)
  // previous graph index used in animations
  const previousGraphIndex = useSharedValue<number>(1)
  // graph index used to display the current graph
  const currentGraphIndex = useSharedValue<number>(1)

  const currentIndexData = useDerivedValue(() => graphs[currentGraphIndex.value].data)

  // mixes graph paths on index change
  const graphTransitionAnimatedProps = useAnimatedProps(() => {
    const previousPath = graphs[previousGraphIndex.value].data.path
    const currentPath = currentIndexData.value.path
    const d = {
      d: mixPath(transition.value, previousPath, currentPath),
    }
    return d
  })

  // animates slider (time range label background) on press
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(BUTTON_WIDTH * currentGraphIndex.value + BUTTON_PADDING) },
    ],
  }))

  // animates label when panning
  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isPanning.value ? 1 : 0),
  }))

  // retrieves price and formats it
  const price = useDerivedValue(() => {
    if (isPanning.value) {
      return interpolate(
        translation.y.value,
        [0, HEIGHT],
        [currentIndexData.value.highPrice, currentIndexData.value.lowPrice]
      )
    }

    return headerCustomPrice ?? currentIndexData.value.closePrice
  })

  // retrieves percent change and formats it
  const percentChange = useDerivedValue(() => {
    if (isPanning.value || headerCustomPercentChange === undefined) {
      return (
        ((price.value - currentIndexData.value.openPrice) / currentIndexData.value.openPrice) * 100
      )
    }

    return headerCustomPercentChange
  })

  // retrieves date and formats it
  const date = useDerivedValue(() => {
    if (!isPanning.value) {
      return ''
    }

    const unix = interpolate(
      translation.x.value,
      [0, WIDTH],
      [currentIndexData.value.openDate, currentIndexData.value.closeDate]
    )

    return new Date(unix * 1000).toLocaleString()
  })

  return (
    <Box>
      <PriceHeader date={date} percentChange={percentChange} price={price} />
      <Box my="lg">
        <Svg height={HEIGHT} width={WIDTH}>
          {customChartLabel && (
            <AnimatedBox flexDirection="row" mx="md" style={labelStyle}>
              {customChartLabel}
            </AnimatedBox>
          )}
          <AnimatedPath
            animatedProps={graphTransitionAnimatedProps}
            fill="transparent"
            stroke={theme.colors.accentAction}
            strokeWidth={3}
          />

          <Defs>
            <LinearGradient id="gradient" x1="50%" x2="50%" y1="0%" y2="100%">
              <Stop offset="0%" stopColor={theme.colors.accentAction} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={theme.colors.accentAction} stopOpacity="0" />
            </LinearGradient>
          </Defs>
        </Svg>
        <Cursor
          graphs={graphs}
          index={currentGraphIndex}
          isActive={isPanning}
          translation={translation}
        />
      </Box>
      <Box alignSelf="center" flexDirection="row" width={WIDTH}>
        <View style={StyleSheet.absoluteFill}>
          <AnimatedBox
            bg="background3"
            borderRadius="xl"
            style={[StyleSheet.absoluteFillObject, sliderStyle]}
            width={LABEL_WIDTH}
          />
        </View>
        {graphs.map((graph, index) => {
          return (
            <TouchableArea
              key={graph.label}
              p="xxs"
              width={BUTTON_WIDTH}
              onPress={() => {
                previousGraphIndex.value = currentGraphIndex.value
                transition.value = 0
                currentGraphIndex.value = index
                transition.value = withTiming(1)
              }}>
              <TimeRangeLabel
                index={index}
                label={graph.label}
                selectedIndex={currentGraphIndex}
                transition={transition}
              />
            </TouchableArea>
          )
        })}
      </Box>
    </Box>
  )
}
