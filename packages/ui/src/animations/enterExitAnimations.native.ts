/**
 * Native implementation - re-exports from react-native-reanimated.
 */
export {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  RotateInUpLeft,
} from 'react-native-reanimated'

// Re-export types for consistency
// biome-ignore lint/suspicious/noExplicitAny: complex Reanimated types vary by platform, any allows flexibility
export type EnteringAnimation = any
// biome-ignore lint/suspicious/noExplicitAny: complex Reanimated types vary by platform, any allows flexibility
export type ExitingAnimation = any
