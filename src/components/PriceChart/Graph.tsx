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
import { GraphMetadatas } from 'src/components/PriceChart/types'
import { Text } from 'src/components/Text'

const AnimatedPath = Animated.createAnimatedComponent(Path)

const SELECTION_WIDTH = WIDTH - 50
const BUTTON_WIDTH = SELECTION_WIDTH / NUM_GRAPHS

interface GraphProps {
  graphs: GraphMetadatas
}

/**
 * Displays a set of graphs with header, scrubbable chart and navigation row.
 * Inspired by https://github.com/wcandillon/can-it-be-done-in-react-native/tree/master/season4/src/Rainbow
 */
export const Graph = ({ graphs }: GraphProps) => {
  const translation = useVector()
  const transition = useSharedValue(0)

  const previousGraphIndex = useSharedValue<number>(0)
  const currentGraphIndex = useSharedValue<number>(0)

  // mixes graph paths on index change
  const graphTransitionAnimatedProps = useAnimatedProps(() => {
    const previousPath = graphs[previousGraphIndex.value].data.path
    const currentPath = graphs[currentGraphIndex.value].data.path
    return {
      //TODO(judo): make animation interruptible
      d: mixPath(transition.value, previousPath, currentPath),
    }
  })
  const graphTransitionClosedAnimatedProps = useAnimatedProps(() => {
    //TODO(judo): figure out a way to merge with `graphTransitionAnimatedProps`
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

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(BUTTON_WIDTH * currentGraphIndex.value) }],
  }))

  return (
    <Box flex={1}>
      <Header translation={translation} index={currentGraphIndex} graphs={graphs} />
      <View>
        <Svg width={WIDTH} height={HEIGHT}>
          <AnimatedPath
            animatedProps={graphTransitionAnimatedProps}
            fill="transparent"
            stroke="#FF007A"
            strokeWidth={2}
          />

          <Defs>
            <LinearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="gradient">
              <Stop stopColor="#FF007A" offset="0%" stopOpacity="0.2" />
              <Stop stopColor="#FF007A" offset="100%" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <AnimatedPath
            animatedProps={graphTransitionClosedAnimatedProps}
            fill="url(#gradient)"
            stroke="transparent"
            strokeWidth={3}
          />
        </Svg>
        <Cursor translation={translation} index={currentGraphIndex} graphs={graphs} />
      </View>
      <Box flexDirection="row" width={SELECTION_WIDTH} alignSelf="center">
        <View style={StyleSheet.absoluteFill}>
          <AnimatedBox
            bg="pink"
            borderRadius="lg"
            width={BUTTON_WIDTH}
            style={[StyleSheet.absoluteFillObject, sliderStyle]}
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
              <AnimatedBox padding="xs" width={BUTTON_WIDTH}>
                <Text
                  variant="buttonLabel"
                  color={index === currentGraphIndex.value ? 'white' : 'primary1'}
                  textAlign="center">
                  {graph.label}
                </Text>
              </AnimatedBox>
            </TouchableWithoutFeedback>
          )
        })}
      </Box>
    </Box>
  )
}
