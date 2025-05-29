import { useCallback } from 'react'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { errorShakeAnimation } from 'ui/src/animations/errorShakeAnimation'

export const useShakeAnimation = (): {
  shakeStyle: ReturnType<typeof useAnimatedStyle>
  triggerShakeAnimation: () => void
} => {
  const shakeValue = useSharedValue(0)
  const shakeStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: shakeValue.value }],
    }),
    [shakeValue.value],
  )

  const triggerShakeAnimation = useCallback(() => {
    shakeValue.value = errorShakeAnimation(shakeValue)
  }, [shakeValue])

  return {
    shakeStyle,
    triggerShakeAnimation,
  }
}
