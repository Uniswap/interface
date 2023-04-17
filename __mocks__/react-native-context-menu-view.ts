import React, { PropsWithChildren } from 'react'
import { View, ViewProps } from 'react-native'

const PlainView = ({
  children,
  ...props
}: PropsWithChildren<unknown>): React.CElement<ViewProps, View> => {
  return React.createElement(View, props, children)
}

export default PlainView
