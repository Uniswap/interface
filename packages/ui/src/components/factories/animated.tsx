import type { ComponentClass } from 'react'

/**
 * Props that Reanimated's AnimateProps adds to components.
 * Defined locally - native uses actual Reanimated types.
 */
type AnimateProps<P extends object> = P & {
  entering?: unknown
  exiting?: unknown
  layout?: unknown
  sharedTransitionTag?: string
  sharedTransitionStyle?: unknown
  animatedProps?: unknown
}

/**
 * Platform-specific implementations:
 * - Web: Returns wrapper without Reanimated (animated.web.tsx)
 * - Native: Returns Reanimated animated component (animated.native.tsx)
 *
 * Returns a component that accepts AnimateProps (entering, exiting, layout, etc.)
 * On native, these props enable Reanimated animations.
 * On web, these props are accepted but ignored.
 */
export function withAnimated<Props extends object>(
  _WrappedComponent: React.ComponentType<Props>,
): ComponentClass<AnimateProps<Props>> {
  throw new Error('withAnimated: Implemented in .native.tsx and .web.tsx')
}
