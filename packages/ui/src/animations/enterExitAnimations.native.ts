/**
 * Native implementation - re-exports from react-native-reanimated.
 */
export { FadeIn, FadeInDown, FadeInUp, FadeOut, FadeOutDown, FadeOutUp, RotateInUpLeft } from 'react-native-reanimated'

// Re-export types for consistency
// oxlint-disable-next-line typescript/no-explicit-any -- complex Reanimated types vary by platform, any allows flexibility
export type EnteringAnimation = any
// oxlint-disable-next-line typescript/no-explicit-any -- complex Reanimated types vary by platform, any allows flexibility
export type ExitingAnimation = any
