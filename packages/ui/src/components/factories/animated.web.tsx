import React, { ComponentClass } from 'react'

/**
 * Props that Reanimated's AnimateProps adds to components.
 * Defined locally to avoid importing from react-native-reanimated on web.
 */
type AnimateProps<P extends object> = P & {
  entering?: unknown
  exiting?: unknown
  layout?: unknown
  sharedTransitionTag?: string
  sharedTransitionStyle?: unknown
  animatedProps?: unknown
}

type AnimatedPropsWeb<P extends object> = Omit<AnimateProps<P>, 'animatedProps'>

/**
 * Web implementation - returns a simple wrapper without Reanimated.
 * On web, the component accepts AnimateProps for API compatibility but ignores them.
 */
export function withAnimated<Props extends object>(
  WrappedComponent: React.ComponentType<Props>,
): ComponentClass<AnimateProps<Props>> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  class WithAnimated extends React.Component<AnimatedPropsWeb<Props>> {
    static displayName = `WithAnimated(${displayName})`

    render(): React.ReactNode {
      // Extract and ignore Reanimated-specific props on web
      const {
        entering: _entering,
        exiting: _exiting,
        layout: _layout,
        sharedTransitionTag: _sharedTransitionTag,
        sharedTransitionStyle: _sharedTransitionStyle,
        ...props
      } = this.props
      return <WrappedComponent {...(props as Props)} />
    }
  }

  return WithAnimated as unknown as ComponentClass<AnimateProps<Props>>
}
