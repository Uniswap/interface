import { PropsWithChildren } from 'react'
import { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { AnimatedTouchableArea } from 'ui/src/components/touchable'
import { HapticFeedbackStyle } from 'ui/src/utils/haptics/helpers'
import { useHapticFeedback } from 'ui/src/utils/haptics/useHapticFeedback'

export const Jiggly = ({
  children,
  hapticFeedback: triggerHapticFeedback,
  hapticStyle,
  offset = 8,
  duration = 100,
}: PropsWithChildren<{
  hapticFeedback?: boolean
  hapticStyle?: HapticFeedbackStyle
  offset?: number
  duration?: number
}>): JSX.Element => {
  const rotate = useSharedValue(0)
  const style = useAnimatedStyle(
    () => ({
      transform: [{ rotateZ: `${rotate.value}deg` }],
    }),
    [rotate],
  )
  const { hapticFeedback } = useHapticFeedback()

  const onPress = async (): Promise<void> => {
    if (triggerHapticFeedback) {
      await hapticFeedback.impact(hapticStyle)
    }

    rotate.value = withSequence(
      withTiming(-offset, { duration: duration / 2 }),
      withRepeat(withTiming(offset, { duration }), 5, true),
      withTiming(0, { duration: duration / 2 }),
    )
  }

  return (
    <AnimatedTouchableArea style={style} onPress={onPress}>
      {children}
    </AnimatedTouchableArea>
  )
}
