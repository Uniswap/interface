import React, { PropsWithChildren } from 'react'
import { Image, ImageProps } from 'react-native'

const PlainImage = ({
  children,
  ...props
}: PropsWithChildren<unknown>): React.CElement<ImageProps, Image> => {
  return React.createElement(Image, props, children)
}

PlainImage.resizeMode = {}

export default PlainImage
