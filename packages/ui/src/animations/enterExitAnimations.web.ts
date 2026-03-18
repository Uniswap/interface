/**
 * Web implementation - exports no-op animation builders.
 *
 * On web, AnimatedFlex renders as a regular Flex that uses CSS animations
 * via Tamagui. The entering/exiting props from react-native-reanimated
 * are not supported, so we export no-op builders that return undefined.
 *
 * These builders support the same chainable API as Reanimated animations
 * (e.g., FadeIn.duration(300).delay(100)) but ultimately return undefined.
 */

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
