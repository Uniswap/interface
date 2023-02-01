import React from 'react'
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
import { Loader } from 'src/components/loading'
import { Cursor } from 'src/components/PriceChart/Cursor'
import { PriceChartLabel } from 'src/components/PriceChart/PriceChartLabels'
import { PriceHeader } from 'src/components/PriceChart/PriceHeader'
import { TimeRangeLabel } from 'src/components/PriceChart/TimeRangeLabel'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { CHART_HEIGHT, CHART_WIDTH, NUM_GRAPHS } from 'src/components/PriceChart/utils'
import { Text } from 'src/components/Text'

const AnimatedPath = Animated.createAnimatedComponent(Path)

export const BUTTON_PADDING = 20
export const BUTTON_WIDTH = CHART_WIDTH / NUM_GRAPHS
export const LABEL_WIDTH = BUTTON_WIDTH - BUTTON_PADDING * 2

interface GraphProps {
  graphs: GraphMetadatas | undefined
  headerCustomPrice?: number
  headerCustomPercentChange?: number
  chartColor?: string
  loading?: boolean
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
  chartColor,
  headerCustomPercentChange,
  loading,
}: GraphProps): JSX.Element => {
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

  const currentIndexData = useDerivedValue(() => graphs?.[currentGraphIndex.value]?.data)

  // mixes graph paths on index change
  const graphTransitionAnimatedProps = useAnimatedProps(() => {
    if (graphs === undefined || currentIndexData.value === undefined) {
      return {}
    }

    const previousPath = graphs[previousGraphIndex.value]?.data.path
    if (!previousPath) return {}

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

  // retrieves price and formats it
  const price = useDerivedValue(() => {
    if (!currentIndexData.value) {
      return headerCustomPrice ?? 0
    }

    if (isPanning.value) {
      return interpolate(
        translation.y.value,
        [0, CHART_HEIGHT],
        [currentIndexData.value.highPrice, currentIndexData.value.lowPrice]
      )
    }

    return headerCustomPrice ?? currentIndexData.value.closePrice
  })

  // retrieves percent change and formats it
  const percentChange = useDerivedValue(() => {
    if (!graphs || !currentIndexData.value) {
      return headerCustomPercentChange ?? 0
    }

    if (
      isPanning.value ||
      headerCustomPercentChange === undefined ||
      // historical chart data is not always live to the latest block
      // for this reason, we usually pass down the latest 24h change to the component and render it when not panning
      // however, we only want to do this for the daily time range to keep 24h consistent across the app
      graphs[currentGraphIndex.value]?.label !== PriceChartLabel.Day
    ) {
      return (
        ((price.value - currentIndexData.value.openPrice) / currentIndexData.value.openPrice) * 100
      )
    }

    return headerCustomPercentChange
  })

  // retrieves date and formats it
  const date = useDerivedValue(() => {
    if (!isPanning.value || !currentIndexData.value) {
      return ''
    }

    const unix = interpolate(
      translation.x.value,
      [0, CHART_WIDTH],
      [currentIndexData.value.openDate, currentIndexData.value.closeDate]
    )

    return new Date(unix * 1000).toLocaleString()
  })

  return (
    <Box>
      <PriceHeader date={date} loading={loading} percentChange={percentChange} price={price} />
      {loading || !graphs ? (
        <>
          <Box my="lg">
            <Loader.Graph />
          </Box>
          <Box alignSelf="center" flexDirection="row" width={CHART_WIDTH}>
            {Object.entries(PriceChartLabel).map(([_key, label]) => {
              return (
                <Box key={label} p="xxs" width={BUTTON_WIDTH}>
                  <Text
                    allowFontScaling={false}
                    color="textTertiary"
                    textAlign="center"
                    variant="buttonLabelSmall">
                    {label}
                  </Text>
                </Box>
              )
            })}
          </Box>
        </>
      ) : (
        <>
          <Box my="lg">
            <Svg height={CHART_HEIGHT} width={CHART_WIDTH}>
              <AnimatedPath
                animatedProps={graphTransitionAnimatedProps}
                fill="transparent"
                stroke={chartColor ?? theme.colors.accentAction}
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
              cursorColor={chartColor}
              graphs={graphs}
              index={currentGraphIndex}
              isActive={isPanning}
              translation={translation}
            />
          </Box>
          <Box alignSelf="center" flexDirection="row" width={CHART_WIDTH}>
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
                  onPress={(): void => {
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
        </>
      )}
    </Box>
  )
}
