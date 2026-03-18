/**
 * Web implementation - returns target values immediately (no animation).
 *
 * On web, these functions simply return the target value without animation.
 * For smooth animations on web, use CSS transitions instead.
 */

// biome-ignore lint/suspicious/noExplicitAny: complex Reanimated config types vary by platform
export type AnimationConfig = any

/**
 * Returns the target value immediately (no animation on web).
 */
export function withTiming<T>(toValue: T, _config?: AnimationConfig): T {
  return toValue
}

/**
 * Returns the target value immediately (no spring animation on web).
 */
export function withSpring<T>(toValue: T, _config?: AnimationConfig): T {
  return toValue
}

/**
 * Returns the animation value immediately (no delay on web).
 */
export function withDelay<T>(_delayMs: number, animation: T): T {
  return animation
}

/**
 * Returns the last animation value (no sequence on web).
 */
export function withSequence<T>(...animations: T[]): T {
  return animations[animations.length - 1] as T
}

/**
 * Returns the animation value (no repeat on web).
 */
// eslint-disable-next-line max-params -- matches react-native-reanimated API
export function withRepeat<T>(animation: T, _numberOfReps?: number, _reverse?: boolean, _callback?: () => void): T {
  return animation
}
