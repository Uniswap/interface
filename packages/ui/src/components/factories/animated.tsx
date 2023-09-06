import React from 'react'
import Animated from 'react-native-reanimated'

// TODO: [MOB-202] find a way keep WrappedComponent props in return type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
