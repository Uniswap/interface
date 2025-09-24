import type { ImageRequireSource } from 'react-native'
import type { FlexProps } from 'ui/src/components/layout/Flex'

export interface UniversalImageStyle {
  backgroundColor?: string
  borderRadius?: number
  verticalAlign?: FlexProps['verticalAlign']
  zIndex?: number
  transition?: string
}

export enum UniversalImageResizeMode {
  Center = 'center',
  Contain = 'contain',
  Cover = 'cover',
  Stretch = 'stretch',
}

export interface UniversalImageStyleProps {
  image?: UniversalImageStyle // ImageStyle
  container?: UniversalImageStyle // ImageStyle
  loadingContainer?: FlexProps['style']
}

interface SharedImageSizeProps {
  width?: number
  height?: number
  aspectRatio?: number
}

export type UniversalImageSize = SharedImageSizeProps & {
  resizeMode?: UniversalImageResizeMode
}

// Top level props

export interface UniversalImageProps {
  uri?: string | ImageRequireSource
  size: UniversalImageSize
  fallback?: JSX.Element
  style?: UniversalImageStyleProps
  fastImage?: boolean
  testID?: string
  allowLocalUri?: boolean
  autoplay?: boolean
  onLoad?: () => void
}

export interface PlainImageProps {
  uri: string
  size: SharedImageSizeProps
  fallback?: JSX.Element
  style?: UniversalImageStyle
  resizeMode?: UniversalImageResizeMode
  testID?: string
  onLoad?: () => void
}

export type FastImageWrapperProps = PlainImageProps & {
  setError: () => void
}

export type SvgImageProps = {
  uri: string
  size: SharedImageSizeProps
  autoplay: boolean
  fallback?: JSX.Element
}
