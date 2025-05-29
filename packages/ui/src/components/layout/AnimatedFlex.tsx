import Animated from 'react-native-reanimated'
import { Flex } from 'ui/src/components/layout/Flex'

/**
 * @deprecated  Prefer `<Flex animation="" />`
 *
 *    See: https://tamagui.dev/docs/core/animations
 *
 * TODO(MOB-1948): Remove this
 */
export const AnimatedFlex = Animated.createAnimatedComponent(Flex)
AnimatedFlex.displayName = 'AnimatedFlex'
