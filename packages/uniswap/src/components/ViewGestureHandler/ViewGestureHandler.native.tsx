import { PropsWithChildren } from 'react'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'

export function ViewGestureHandler({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <NativeViewGestureHandler>{children}</NativeViewGestureHandler>
}
