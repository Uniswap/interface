import type { ViewStyle } from 'react-native'

export interface ShakeAnimation {
  shakeStyle: ViewStyle
  triggerShakeAnimation: () => void
}

/**
 * Platform-specific implementations:
 * - Web: Uses CSS animations (useShakeAnimation.web.ts)
 * - Native: Uses react-native-reanimated (useShakeAnimation.native.ts)
 */
export const useShakeAnimation = (): ShakeAnimation => {
  throw new Error('useShakeAnimation: Implemented in `.native.ts` and `.web.ts` files')
}
