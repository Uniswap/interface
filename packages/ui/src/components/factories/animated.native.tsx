import React, { ComponentClass } from 'react'
import Animated, { AnimateProps } from 'react-native-reanimated'

export function withAnimated<Props extends object>(
  WrappedComponent: React.ComponentType<Props>,
): ComponentClass<AnimateProps<Props>> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  class WithAnimated extends React.Component<AnimateProps<Props>> {
    static displayName = `WithAnimated(${displayName})`

    render(): React.ReactNode {
      return <WrappedComponent {...(this.props as Props)} />
    }
  }

  return Animated.createAnimatedComponent(WithAnimated as unknown as React.ComponentClass<Props>)
}
