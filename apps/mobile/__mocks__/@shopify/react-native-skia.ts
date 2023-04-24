import React, { PropsWithChildren } from 'react'
import { View, ViewProps } from 'react-native'

// Source: https://github.com/Shopify/react-native-skia/issues/548#issuecomment-1157609472

const PlainView = ({
  children,
  ...props
}: PropsWithChildren<unknown>): React.CElement<ViewProps, View> => {
  return React.createElement(View, props, children)
}
const noop = (): null => null

export const BlurMask = PlainView
export const Canvas = PlainView
export const Circle = PlainView
export const Group = PlainView
export const LinearGradient = PlainView
export const Mask = PlainView
export const Path = PlainView
export const Rect = PlainView
export const vec = noop
