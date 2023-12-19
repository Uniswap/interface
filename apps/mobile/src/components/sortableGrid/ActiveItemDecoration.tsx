import { PropsWithChildren } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { colors, opacify } from 'ui/src/theme'
import { useSortableGridContext } from './SortableGridProvider'

type ActiveItemDecorationProps = PropsWithChildren<{
  renderIndex: number
}>

export default function ActiveItemDecoration({
  renderIndex,
  children,
}: ActiveItemDecorationProps): JSX.Element {
  const {
    touchedIndex,
    activeItemScale,
    previousActiveIndex,
    activeItemOpacity,
    activeItemShadowOpacity,
    dragActivationProgress,
  } = useSortableGridContext()

  const pressProgress = useSharedValue(0)

  useAnimatedReaction(
    () => ({
      isTouched: touchedIndex.value === renderIndex,
      wasTouched: previousActiveIndex.value === renderIndex,
      progress: dragActivationProgress.value,
    }),
    ({ isTouched, wasTouched, progress }) => {
      if (isTouched) {
        // If the item is currently touched, we want to animate the press progress
        // (change the decoration) based on the drag activation progress
        pressProgress.value = Math.max(pressProgress.value, progress)
      } else if (wasTouched) {
        // If the item was touched (the user released the finger) and the item
        // was previously touched, we want to animate it based on the decreasing
        // press progress
        pressProgress.value = Math.min(pressProgress.value, progress)
      } else {
        // For all other cases, we want to ensure that the press progress is reset
        // and all non-touched items are not decorated
        pressProgress.value = withTiming(0)
      }
    }
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(pressProgress.value, [0, 1], [1, activeItemScale.value]),
      },
    ],
    opacity: interpolate(pressProgress.value, [0, 1], [1, activeItemOpacity.value]),
    shadowColor: interpolateColor(
      pressProgress.value,
      [0, 1],
      ['transparent', opacify(100 * activeItemShadowOpacity.value, colors.black)]
    ),
  }))

  return <Animated.View style={[styles.shadow, animatedStyle]}>{children}</Animated.View>
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 0,
    elevation: 40,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
})
