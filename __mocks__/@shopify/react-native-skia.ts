import { createElement, PropsWithChildren } from 'react'
import { View } from 'react-native'

// Source: https://github.com/Shopify/react-native-skia/issues/548#issuecomment-1157609472

const PlainView = ({ children, ...props }: PropsWithChildren<unknown>) =>
  createElement(View, props, children)
const noop = () => null

jest.mock('@shopify/react-native-skia', () => {
  return {
    Canvas: PlainView,
    BlurMask: PlainView,
    Circle: PlainView,
    Group: PlainView,
    LinearGradient: PlainView,
    Mask: PlainView,
    Path: PlainView,
    Rect: PlainView,
    vec: noop,
  }
})
