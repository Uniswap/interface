import { LayoutAnimation, withTiming } from 'react-native-reanimated'
import { ITEM_ANIMATION_DURATION } from 'src/components/sortableGrid/internal/constants'

export const GridItemExiting = (): LayoutAnimation => {
  'worklet'
  const animations = {
    opacity: withTiming(0, {
      duration: ITEM_ANIMATION_DURATION,
    }),
    transform: [
      {
        scale: withTiming(0.5, {
          duration: ITEM_ANIMATION_DURATION,
        }),
      },
    ],
  }
  const initialValues = {
    opacity: 1,
    transform: [{ scale: 1 }],
  }
  return {
    initialValues,
    animations,
  }
}
