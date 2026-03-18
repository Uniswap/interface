import { type ComponentRef, forwardRef } from 'react'
import type { AnimatedFlexProps } from 'ui/src/components/layout/AnimatedFlex'
import { Flex, type FlexProps } from 'ui/src/components/layout/Flex'

type AnimatedFlexComponent = React.ForwardRefExoticComponent<
  AnimatedFlexProps & React.RefAttributes<ComponentRef<typeof Flex>>
>

/**
 * Web-specific AnimatedFlex that uses CSS animations instead of react-native-reanimated.
 *
 * On web, the Tamagui animation system (configured in theme/animations/index.web.ts)
 * uses CSS transitions. This component simply renders a Flex with the animation prop
 * and applies any style passed in.
 *
 * The `style` prop may contain animated values from web-specific animation hooks
 * (like useShakeAnimation.web.ts) which use CSS classes/inline styles.
 *
 * The Reanimated props (entering, exiting, layout) are accepted for compatibility
 * with native code but are ignored on web.
 *
 * @deprecated Prefer `<Flex animation="" />` - see: https://tamagui.dev/docs/core/animations
 * TODO(MOB-1948): Remove this
 */
export const AnimatedFlex: AnimatedFlexComponent = forwardRef<ComponentRef<typeof Flex>, AnimatedFlexProps>(
  function AnimatedFlex({ entering: _entering, exiting: _exiting, layout: _layout, ...props }, ref) {
    return <Flex ref={ref} {...(props as FlexProps)} />
  },
)

AnimatedFlex.displayName = 'AnimatedFlex'
