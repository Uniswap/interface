/**
 * Platform-agnostic error shake animation export.
 *
 * - Native: Uses react-native-reanimated (errorShakeAnimation.native.ts)
 * - Web: No-op implementation (errorShakeAnimation.web.ts)
 */

export interface SharedValue<T> {
  value: T
}

/**
 * Applies a shake animation to indicate an error.
 * Returns the animated value for the shake offset.
 */
export function errorShakeAnimation(_input: SharedValue<number>): number {
  throw new Error('errorShakeAnimation: Implemented in .native.ts and .web.ts')
}
