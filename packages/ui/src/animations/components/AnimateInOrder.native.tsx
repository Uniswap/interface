import { AnimatedFlex } from '@universe/mycelium'
import { useEffect } from 'react'
import { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import type { AnimateInOrderProps } from 'ui/src/animations/components/AnimateInOrder'
import {
  ANIMATE_IN_ORDER_DELAY_MS,
  ANIMATE_IN_ORDER_SPRING,
  DEFAULT_ENTER_STYLE,
} from 'ui/src/animations/components/AnimateInOrder.constants'

export { ANIMATE_IN_ORDER_DELAY_MS } from 'ui/src/animations/components/AnimateInOrder.constants'

/**
 * Native: reveals the mounted child with a Reanimated worklet. The Tamagui animation driver is
 * bypassed on purpose — its opacity transition can miss the composited frame on iOS Fabric,
 * leaving the child permanently invisible.
 */
export const AnimateInOrder = ({
  children,
  index,
  enterStyle = DEFAULT_ENTER_STYLE,
  delayMs = ANIMATE_IN_ORDER_DELAY_MS,
  style,
  ...rest
}: AnimateInOrderProps): JSX.Element => {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(index * delayMs, withSpring(1, ANIMATE_IN_ORDER_SPRING))
  }, [index, delayMs, progress])

  const fromOpacity = enterStyle.opacity ?? DEFAULT_ENTER_STYLE.opacity
  const fromScale = enterStyle.scale ?? DEFAULT_ENTER_STYLE.scale

  const animatedStyle = useAnimatedStyle(() => {
    return {
      // The spring overshoots past 1; clamp opacity, let scale bounce.
      opacity: Math.min(1, fromOpacity + (1 - fromOpacity) * progress.value),
      transform: [{ scale: fromScale + (1 - fromScale) * progress.value }],
    }
  }, [fromOpacity, fromScale, progress])

  return (
    // animatedStyle last so a caller-passed `style` can't replace the reveal
    <AnimatedFlex {...rest} style={[style, animatedStyle]}>
      {children}
    </AnimatedFlex>
  )
}
