import { type ComponentRef, forwardRef } from 'react'
import { Flex, type FlexProps } from 'ui/src/components/layout/Flex'

/**
 * Extended FlexProps that accepts Reanimated entering/exiting props and animated styles.
 * On web, Reanimated props are ignored - animations use CSS via Tamagui instead.
 */
export type AnimatedFlexProps = Omit<FlexProps, 'style'> & {
  // Style prop that accepts both regular and animated styles from useAnimatedStyle
  // biome-ignore lint/suspicious/noExplicitAny: Style prop accepts animated styles which have complex types
  style?: any
  // Reanimated entering/exiting animations - used on native, ignored on web
  // biome-ignore lint/suspicious/noExplicitAny: Reanimated animation types are complex and platform-specific
  entering?: any
  // biome-ignore lint/suspicious/noExplicitAny: Reanimated animation types are complex and platform-specific
  exiting?: any
  // Layout animation
  // biome-ignore lint/suspicious/noExplicitAny: Reanimated animation types are complex and platform-specific
  layout?: any
}

type AnimatedFlexComponent = React.ForwardRefExoticComponent<
  AnimatedFlexProps & React.RefAttributes<ComponentRef<typeof Flex>>
>

/**
 * @deprecated Prefer `<Flex animation="" />`
 *
 *    See: https://tamagui.dev/docs/core/animations
 *
 * TODO(MOB-1948): Remove this
 *
 * Platform-specific implementations:
 * - Web: Uses CSS animations (AnimatedFlex.web.tsx)
 * - Native: Uses react-native-reanimated (AnimatedFlex.native.tsx)
 */
export const AnimatedFlex: AnimatedFlexComponent = forwardRef<ComponentRef<typeof Flex>, AnimatedFlexProps>(
  function AnimatedFlex(_, __) {
    throw new Error('AnimatedFlex: Implemented in `.native.tsx` and `.web.tsx` files')
  },
)

AnimatedFlex.displayName = 'AnimatedFlex'
