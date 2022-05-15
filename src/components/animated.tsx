import React from 'react'
import Animated from 'react-native-reanimated'

// TODO: find a way keep WrappedComponent props in return type
export function withAnimated(WrappedComponent: React.ComponentType<any>): any {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  class WithAnimated extends React.Component {
    static displayName = `WithAnimated(${displayName})`

    render(): React.ReactNode {
      return <WrappedComponent {...this.props} />
    }
  }

  return Animated.createAnimatedComponent(WithAnimated)
}
