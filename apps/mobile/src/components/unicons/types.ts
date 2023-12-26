import { Color } from '@shopify/react-native-skia'
import { svgPaths as containerPaths } from 'src/components/unicons/Container'
import { svgPaths as emblemPaths } from 'src/components/unicons/Emblem'
import { PathProps } from './svgTypes'

export enum UniconAttributes {
  GradientStart = 0,
  GradientEnd = 1,
  Container = 2,
  Shape = 3,
}

export const UniconAttributesArray: UniconAttributes[] = [
  UniconAttributes.GradientStart,
  UniconAttributes.GradientEnd,
  UniconAttributes.Container,
  UniconAttributes.Shape,
]

export interface UniconAttributesToIndices {
  [UniconAttributes.GradientStart]: number
  [UniconAttributes.GradientEnd]: number
  [UniconAttributes.Container]: number
  [UniconAttributes.Shape]: number
}

export interface UniconAttributeData {
  [UniconAttributes.GradientStart]: Color
  [UniconAttributes.GradientEnd]: Color
  [UniconAttributes.Container]: PathProps[]
  [UniconAttributes.Shape]: PathProps[]
}

export const gradientStarts = [
  '#6100FF',
  '#5065FD',
  '#36DBFF',
  '#5CFE9D',
  '#B1F13C',
  '#F9F40B',
  '#FF6F1E',
  '#F14544',
  '#FC72FF',
  '#C0C0C0',
]

export const blurs = [
  '#D3EBA3',
  '#F06DF3',
  '#9D99F5',
  '#EDE590',
  '#B0EDFE',
  '#FBAA7F',
  '#C8BB9B',
  '#9D99F5',
  '#A26AF3',
  '#D3EBA3',
]

export const gradientEnds = [
  '#D0B2F3',
  '#BDB8FA',
  '#63CDE8',
  '#76D191',
  '#9BCD46',
  '#EDE590',
  '#FBAA7F',
  '#FEA79B',
  '#F5A1F5',
  '#B8C3B7',
]

export const UniconNumOptions = {
  [UniconAttributes.GradientStart]: gradientStarts.length,
  [UniconAttributes.GradientEnd]: gradientEnds.length,
  [UniconAttributes.Container]: containerPaths.length,
  [UniconAttributes.Shape]: emblemPaths.length,
}
