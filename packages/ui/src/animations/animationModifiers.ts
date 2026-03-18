/**
 * Platform-agnostic animation modifier exports.
 *
 * - Native: Re-exports from react-native-reanimated (animationModifiers.native.ts)
 * - Web: Exports simplified implementations (animationModifiers.web.ts)
 */

// biome-ignore lint/suspicious/noExplicitAny: complex Reanimated config types vary by platform
export type AnimationConfig = any

/**
 * Animates to a value with timing-based easing.
 */
export function withTiming<T>(_toValue: T, _config?: AnimationConfig): T {
  throw new Error('withTiming: Implemented in .native.ts and .web.ts')
}

/**
 * Animates to a value with spring physics.
 */
export function withSpring<T>(_toValue: T, _config?: AnimationConfig): T {
  throw new Error('withSpring: Implemented in .native.ts and .web.ts')
}

/**
 * Delays an animation.
 */
export function withDelay<T>(_delayMs: number, _animation: T): T {
  throw new Error('withDelay: Implemented in .native.ts and .web.ts')
}

/**
 * Runs animations in sequence.
 */
export function withSequence<T>(..._animations: T[]): T {
  throw new Error('withSequence: Implemented in .native.ts and .web.ts')
}

/**
 * Repeats an animation.
 */
// eslint-disable-next-line max-params -- matches react-native-reanimated API
export function withRepeat<T>(_animation: T, _numberOfReps?: number, _reverse?: boolean): T {
  throw new Error('withRepeat: Implemented in .native.ts and .web.ts')
}
