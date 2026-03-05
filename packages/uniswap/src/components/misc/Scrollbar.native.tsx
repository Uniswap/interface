import Animated, {
  Extrapolate,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { Flex, FlexProps } from 'ui/src'

type ScrollbarProps = FlexProps & {
  visibleHeight: number
  contentHeight: number
  scrollOffset: SharedValue<number>
}

export function Scrollbar({ visibleHeight, contentHeight, scrollOffset, ...rest }: ScrollbarProps): JSX.Element {
  const scrollbarHeight = useSharedValue(0)

  const animatedThumbStyle = useAnimatedStyle(() => {
    const thumbHeight = (visibleHeight / contentHeight) * scrollbarHeight.value

    return {
      top: interpolate(
        scrollOffset.value,
        [0, contentHeight - visibleHeight],
        [0, scrollbarHeight.value - thumbHeight],
        Extrapolate.CLAMP,
      ),
      height: thumbHeight,
    }
  })

  return (
    <Flex
      animation="quicker"
      enterStyle={{
        opacity: 0,
        width: 0,
      }}
      width={6}
      {...rest}
    >
      <Flex
        fill
        onLayout={({
          nativeEvent: {
            layout: { height },
          },
        }) => {
          scrollbarHeight.value = height
        }}
      >
        <Animated.View style={animatedThumbStyle}>
          <Flex fill backgroundColor="$neutral3" borderRadius="$rounded12" />
        </Animated.View>
      </Flex>
    </Flex>
  )
}
