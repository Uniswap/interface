import type { ImageRequireSource } from 'react-native'
import type { FlexProps } from 'ui/src/components/layout/Flex'

/** Dimension value compatible with both web CSS and React Native */
export type UniversalImageStyleDimensionValue = number | `${number}%` | 'auto' | undefined

export interface UniversalImageStyle {
  backgroundColor?: string
  borderRadius?: number
  verticalAlign?: FlexProps['verticalAlign']
  zIndex?: number
  transition?: string
  width?: UniversalImageStyleDimensionValue
  height?: UniversalImageStyleDimensionValue
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
  testID?: string
  allowLocalUri?: boolean
  autoplay?: boolean
  onLoad?: () => void
  onError?: () => void
  /** Native iOS only: Renders the image to a bitmap for improved performance with complex/animated content like GIFs */
  shouldRasterizeIOS?: boolean
  /** Allow rendering without explicit dimensions. Use when parent container has fixed size and image should fill it. */
  allowUndefinedSize?: boolean
  /**
   * Skip the `Image.getSize` pre-fetch used to derive dimensions. Set to true when the
   * parent container has a fixed size and intrinsic dimensions are not needed
   */
  skipSizeCalculation?: boolean
  /** Cross-fade duration in ms when the URI changes. Default 200. Set to 0 to skip the
   * dual-bitmap cross-fade on memory-sensitive surfaces (e.g. NFT grids). */
  transitionMs?: number
  /** Native loading-queue hint. `'low'` lets higher-priority images preempt. */
  priority?: 'low' | 'normal' | 'high'
}

export interface PlainImageProps {
  uri: string
  size: SharedImageSizeProps
  fallback?: JSX.Element
  style?: UniversalImageStyle
  resizeMode?: UniversalImageResizeMode
  testID?: string
  onLoad?: () => void
  onError?: () => void
  autoplay?: boolean
  /** Cross-fade duration in ms when the URI changes. Default 200. Set to 0 to skip the
   * dual-bitmap cross-fade entirely on memory-sensitive surfaces (e.g. NFT grids). */
  transitionMs?: number
  /** Native loading-queue hint. `'low'` lets higher-priority images preempt. */
  priority?: 'low' | 'normal' | 'high'
}

export type PlainImageExpoProps = PlainImageProps & {
  cacheInMemory?: boolean
}

export type SvgImageProps = {
  uri: string
  size: SharedImageSizeProps
  autoplay: boolean
  fallback?: JSX.Element
  style?: UniversalImageStyle
  resizeMode?: UniversalImageResizeMode
  onError?: () => void
}
