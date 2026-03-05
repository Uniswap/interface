/**
 * Platform-agnostic entering/exiting animation exports.
 *
 * - Native: Re-exports from react-native-reanimated (enterExitAnimations.native.ts)
 * - Web: Exports no-op builders (enterExitAnimations.web.ts)
 *
 * Usage:
 * ```tsx
 * import { FadeIn, FadeOut } from 'ui/src/animations/enterExitAnimations'
 * <AnimatedFlex entering={FadeIn} exiting={FadeOut} />
 * ```
 *
 * Note: This base file exports no-op builders to ensure type safety if accidentally
 * imported directly. Platform-specific files should be resolved by the bundler.
 */

// Generic type that works across platforms - animations can be undefined on web
// biome-ignore lint/suspicious/noExplicitAny: complex Reanimated types vary by platform, any allows flexibility
export type EnteringAnimation = any
// biome-ignore lint/suspicious/noExplicitAny: complex Reanimated types vary by platform, any allows flexibility
export type ExitingAnimation = any

/**
 * Creates a no-op animation builder that supports the Reanimated chainable API.
 * All methods return `this` to support chaining, and when used as a value,
 * it evaluates to undefined (via valueOf/toString).
 */
function createNoOpAnimationBuilder(): EnteringAnimation {
  const builder = {
    duration: () => builder,
    delay: () => builder,
    easing: () => builder,
    springify: () => builder,
    damping: () => builder,
    mass: () => builder,
    stiffness: () => builder,
    overshootClamping: () => builder,
    restDisplacementThreshold: () => builder,
    restSpeedThreshold: () => builder,
    withInitialValues: () => builder,
    withCallback: () => builder,
    randomDelay: () => builder,
    // When used as a value in JSX props, return undefined
    valueOf: () => undefined,
    toString: () => 'undefined',
  }
  return builder
}

export const FadeIn = createNoOpAnimationBuilder()
export const FadeOut = createNoOpAnimationBuilder()
export const FadeInDown = createNoOpAnimationBuilder()
export const FadeInUp = createNoOpAnimationBuilder()
export const FadeOutDown = createNoOpAnimationBuilder()
export const FadeOutUp = createNoOpAnimationBuilder()
export const RotateInUpLeft = createNoOpAnimationBuilder()
