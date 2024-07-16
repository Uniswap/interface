/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { ImageSourcePropType } from 'react-native'

declare class QRCode extends React.PureComponent<QRCodeProps, any> {}

export interface QRCodeProps {
  /* what the qr code stands for */
  value?: string
  /* the whole component size */
  size?: number
  /* the color of the cell */
  color?: string
  /* the color of the background */
  backgroundColor?: string
  /* the color of the background */
  overlayColor?: string
  /* an image source object. example {uri: 'base64string'} or {require('pathToImage')} */
  logo?: ImageSourcePropType
  /* logo size in pixels */
  logoSize?: number
  /* the logo gets a filled rectangular background with this color. Use 'transparent'
         if your logo already has its own backdrop. Default = same as backgroundColor */
  logoBackgroundColor?: string
  /* logo's distance to its wrapper */
  logoMargin?: number
  /* the border-radius of logo image */
  logoBorderRadius?: number
  /* quiet zone in pixels */
  quietZone?: number
  /* enable linear gradient effect */
  enableLinearGradient?: boolean
  /* linear gradient direction */
  gradientDirection?: string[]
  /* linear gradient color */
  linearGradient?: string[]
  /* get svg ref for further usage */
  getRef?: (c: any) => any
  /* error correction level */
  ecl?: 'L' | 'M' | 'Q' | 'H'
  /* error handler called when matrix fails to generate */
  onError?: () => void
}

export default QRCode
