import Animated from 'react-native-reanimated'
import { Flex } from 'ui/src/components/layout/Flex'

/**
 * Prefer Tamagui declarative animations (`<Flex animation="..." />`). Use AnimatedFlex only for an external
 * Reanimated `useAnimatedStyle` worklet — RN 4 strict mode rejects animated styles on non-animated components.
 *
 *    See: https://tamagui.dev/docs/core/animations
 */
export const AnimatedFlex = Animated.createAnimatedComponent(Flex)
// Reanimated v4 returns a function-style AnimatedComponentType that doesn't expose
// `displayName` on the type. Cast through unknown to assign for devtools labeling.
;(AnimatedFlex as unknown as { displayName?: string }).displayName = 'AnimatedFlex'
