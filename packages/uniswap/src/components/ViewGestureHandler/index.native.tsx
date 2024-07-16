import { PropsWithChildren } from 'react'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'

function ViewGestureHandler({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <NativeViewGestureHandler>{children}</NativeViewGestureHandler>
}

export default ViewGestureHandler
