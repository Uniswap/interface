import { FastImageProps, ImageStyle, ResizeMode } from 'react-native-fast-image'
import { BoxProps } from 'ui/src'
import { NotImplementedError } from 'utilities/src/errors'

export type ImageUriProps = {
  maxHeight?: number
  uri?: string
  fallback?: JSX.Element
  imageStyle?: ImageStyle
  resizeMode?: ResizeMode
  loadingContainerStyle?: BoxProps['style']
  loadedImageContainerStyle?: ImageStyle
  /**
   * Can optimize performance by prefetching dimensions in api request on Image field,
   * which allows us to avoid setting state in this component
   */
  imageDimensions?: { width: number; height: number } | undefined
} & Pick<FastImageProps, 'shouldRasterizeIOS'>

export function ImageUri(_: ImageUriProps): JSX.Element | null {
  throw new NotImplementedError('ImageURI')
}
