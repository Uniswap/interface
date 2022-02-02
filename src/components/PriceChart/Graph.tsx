import { useTheme } from '@shopify/restyle'
import React from 'react'
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { mixPath, useVector } from 'react-native-redash'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import { Cursor } from 'src/components/PriceChart/Cursor'
import { Header } from 'src/components/PriceChart/Header'
import { HEIGHT, NUM_GRAPHS, WIDTH } from 'src/components/PriceChart/Model'
import { TimeRangeLabel } from 'src/components/PriceChart/TimeRangeLabel'
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { Theme } from 'src/styles/theme'

const AnimatedPath = Animated.createAnimatedComponent(Path)

const SELECTION_WIDTH = WIDTH - 50
const BUTTON_WIDTH = SELECTION_WIDTH / NUM_GRAPHS

interface GraphProps {
  graphs: GraphMetadatas
  title: string
}

/**
 * Displays a set of graphs with header, scrubbable chart and navigation row.
 * Inspired by https://github.com/wcandillon/can-it-be-done-in-react-native/tree/master/season4/src/Rainbow
 */
export const Graph = ({ graphs, title }: GraphProps) => {
  const theme = useTheme<Theme>()

  // whether the graph pan gesture is active
  const isPanning = useSharedValue(false)
  // pan gesture x and y
  const translation = useVector()
  // used in animations
  const transition = useSharedValue(1)
  // previous graph index used in animations
  const previousGraphIndex = useSharedValue<number>(0)
  // graph index used to display the current graph
  const currentGraphIndex = useSharedValue<number>(0)

  // mixes graph paths on index change
  const graphTransitionAnimatedProps = useAnimatedProps(() => {
    const previousPath = graphs[previousGraphIndex.value].data.path
    const currentPath = graphs[currentGraphIndex.value].data.path
    const d = {
      d: mixPath(transition.value, previousPath, currentPath),
    }
    return d
  })
  const graphTransitionClosedAnimatedProps = useAnimatedProps(() => {
    const previousPath = graphs[previousGraphIndex.value].data.path
    const currentPath = graphs[currentGraphIndex.value].data.path
    return {
      d: `${mixPath(
        transition.value,
        previousPath,
        currentPath
      )} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT}`,
    }
  })

  // animates slider (time range label background) on press
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(BUTTON_WIDTH * currentGraphIndex.value) }],
  }))

  return (
    <Box flex={1}>
      <Header
        graphs={graphs}
        index={currentGraphIndex}
        isPanning={isPanning}
        title={title}
        translation={translation}
      />
      <Box mb="sm">
        <Svg height={HEIGHT} width={WIDTH}>
          <AnimatedPath
            animatedProps={graphTransitionAnimatedProps}
            fill="transparent"
            stroke={theme.colors.primary1}
            strokeWidth={2}
          />

          <Defs>
            <LinearGradient id="gradient" x1="50%" x2="50%" y1="0%" y2="100%">
              <Stop offset="0%" stopColor={theme.colors.primary1} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={theme.colors.primary1} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <AnimatedPath
            animatedProps={graphTransitionClosedAnimatedProps}
            fill="url(#gradient)"
            stroke="transparent"
            strokeWidth={3}
          />
        </Svg>
        <Cursor
          graphs={graphs}
          index={currentGraphIndex}
          isActive={isPanning}
          translation={translation}
        />
      </Box>
      <Box alignSelf="center" flexDirection="row" width={SELECTION_WIDTH}>
        <View style={StyleSheet.absoluteFill}>
          <AnimatedBox
            bg="primary1"
            borderRadius="lg"
            style={[StyleSheet.absoluteFillObject, sliderStyle]}
            width={BUTTON_WIDTH}
          />
        </View>
        {graphs.map((graph, index) => {
          return (
            <TouchableWithoutFeedback
              key={graph.label}
              onPress={() => {
                previousGraphIndex.value = currentGraphIndex.value
                transition.value = 0
                currentGraphIndex.value = index
                transition.value = withTiming(1)
              }}>
              <Box padding="xs" width={BUTTON_WIDTH}>
                <TimeRangeLabel
                  index={index}
                  label={graph.label}
                  selectedIndex={currentGraphIndex}
                  transition={transition}
                />
              </Box>
            </TouchableWithoutFeedback>
          )
        })}
      </Box>
    </Box>
  )
}
