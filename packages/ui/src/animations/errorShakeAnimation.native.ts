import { Easing, SharedValue, withRepeat, withTiming } from 'react-native-reanimated'

export function errorShakeAnimation(input: SharedValue<number>): number {
  return withRepeat(withTiming(5, { duration: 50, easing: Easing.inOut(Easing.ease) }), 3, true, () => {
    input.value = 0
  })
}
